import { createDecipheriv } from 'node:crypto';
import { Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DatabaseClient } from '@repo/database';
import type { Transporter } from 'nodemailer';
import { config } from '@/config';

type ClaimedMessage = { id: string; topic: string; encrypted_payload: string; attempts: number };
type EmailPayload = { email: string; username: string; token: string; expiresAt: string };

export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

@Injectable()
export class OutboxEmailService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxEmailService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(
    private readonly db: DatabaseClient,
    @Inject(MAIL_TRANSPORT) private readonly transport: Transporter,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.drain(), config.OUTBOX_POLL_INTERVAL_MS);
    void this.drain();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    this.transport.close();
  }

  private async drain(): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      for (let i = 0; i < 10; i += 1) {
        if (!(await this.runOnce())) break;
      }
    } finally {
      this.running = false;
    }
  }

  async runOnce(): Promise<boolean> {
    const message = await this.claim();
    if (!message) return false;
    await this.process(message);
    return true;
  }

  private async claim(): Promise<ClaimedMessage | undefined> {
    const rows = await this.db.$queryRaw<ClaimedMessage[]>`
      WITH candidate AS (
        SELECT id FROM outbox_messages
        WHERE status IN ('PENDING', 'PROCESSING')
          AND next_attempt_at <= NOW()
          AND (locked_at IS NULL OR locked_at < NOW() - INTERVAL '5 minutes')
        ORDER BY created_at
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE outbox_messages AS message
      SET status = 'PROCESSING', locked_at = NOW(), attempts = attempts + 1
      FROM candidate
      WHERE message.id = candidate.id
      RETURNING message.id, message.topic, message.encrypted_payload, message.attempts
    `;
    return rows[0];
  }

  private async process(message: ClaimedMessage): Promise<void> {
    try {
      const payload = this.decrypt(message.encrypted_payload);
      const isVerification = message.topic === 'auth.verify_email';
      if (!isVerification && message.topic !== 'auth.reset_password')
        throw new Error(`Unsupported outbox topic: ${message.topic}`);
      const path = isVerification ? 'verify-email' : 'reset-password';
      const subject = isVerification ? 'Verify your Cinema account' : 'Reset your Cinema password';
      const url = `${config.WEB_ORIGIN}/${path}?token=${encodeURIComponent(payload.token)}`;
      await this.transport.sendMail({
        from: config.MAIL_FROM,
        to: payload.email,
        subject,
        text: `Hello ${payload.username}, open this link before ${payload.expiresAt}: ${url}`,
        html: `<p>Hello ${this.escape(payload.username)},</p><p><a href="${this.escape(url)}">${subject}</a></p>`,
      });
      await this.db.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: 'SENT',
          processedAt: new Date(),
          lockedAt: null,
          encryptedPayload: '',
          lastError: null,
        },
      });
    } catch (error) {
      const failed = message.attempts >= 8;
      const delaySeconds = Math.min(3600, 2 ** message.attempts * 5);
      await this.db.outboxMessage.update({
        where: { id: message.id },
        data: {
          status: failed ? 'FAILED' : 'PENDING',
          lockedAt: null,
          nextAttemptAt: new Date(Date.now() + delaySeconds * 1000),
          lastError: this.safeError(error),
        },
      });
      this.logger.warn(`Outbox email ${message.id} failed (attempt ${message.attempts})`);
    }
  }

  private decrypt(value: string): EmailPayload {
    const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
    if (!iv || !tag || !encrypted) throw new Error('Invalid encrypted payload');
    const key = Buffer.from(config.AUTH_OUTBOX_ENCRYPTION_KEY, 'base64');
    if (key.length !== 32) throw new Error('AUTH_OUTBOX_ENCRYPTION_KEY must decode to 32 bytes');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'),
    ) as EmailPayload;
  }

  private safeError(error: unknown): string {
    return error instanceof Error ? error.message.slice(0, 500) : 'Unknown delivery error';
  }
  private escape(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
    );
  }
}
