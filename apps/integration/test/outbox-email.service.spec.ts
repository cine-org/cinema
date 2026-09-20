import { createCipheriv } from 'node:crypto';
import type { DatabaseClient } from '@repo/database';
import type { Transporter } from 'nodemailer';

const mockEncryptionKey = Buffer.alloc(32, 7);

jest.mock('@/config', () => ({
  config: {
    AUTH_OUTBOX_ENCRYPTION_KEY: mockEncryptionKey.toString('base64'),
    WEB_ORIGIN: 'https://cinema.example',
    MAIL_FROM: 'Cinema <noreply@cinema.example>',
    OUTBOX_POLL_INTERVAL_MS: 60_000,
  },
}));

import { OutboxEmailService } from '@/outbox-email.service';

describe('OutboxEmailService', () => {
  it('requeues an SMTP failure with exponential backoff without exposing the payload', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const db = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'message-1',
          topic: 'auth.verify_email',
          encrypted_payload: encrypt({
            email: 'viewer@example.test',
            username: 'viewer',
            token: 'secret-verification-token',
            expiresAt: '2026-09-20T00:00:00.000Z',
          }),
          attempts: 2,
        },
      ]),
      outboxMessage: { update },
    };
    const transport = {
      sendMail: jest.fn().mockRejectedValue(new Error('SMTP unavailable')),
      close: jest.fn(),
    };
    const service = new OutboxEmailService(
      db as unknown as DatabaseClient,
      transport as unknown as Transporter,
    );

    await expect(service.runOnce()).resolves.toBe(true);
    const failureUpdate = update.mock.calls[0]?.[0] as unknown as {
      where: { id: string };
      data: { status: string; lockedAt: Date | null; lastError: string };
    };
    expect(failureUpdate.where.id).toBe('message-1');
    expect(failureUpdate.data).toMatchObject({
      status: 'PENDING',
      lockedAt: null,
      lastError: 'SMTP unavailable',
    });
    expect(JSON.stringify(update.mock.calls)).not.toContain('secret-verification-token');
  });

  it('scrubs the encrypted payload after successful delivery', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    const db = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'message-2',
          topic: 'auth.reset_password',
          encrypted_payload: encrypt({
            email: 'viewer@example.test',
            username: '<viewer>',
            token: 'secret-reset-token',
            expiresAt: '2026-09-20T00:00:00.000Z',
          }),
          attempts: 1,
        },
      ]),
      outboxMessage: { update },
    };
    const transport = { sendMail: jest.fn().mockResolvedValue({}), close: jest.fn() };
    const service = new OutboxEmailService(
      db as unknown as DatabaseClient,
      transport as unknown as Transporter,
    );

    await service.runOnce();
    const mail = transport.sendMail.mock.calls[0]?.[0] as unknown as {
      to: string;
      html: string;
    };
    expect(mail.to).toBe('viewer@example.test');
    expect(mail.html).toContain('&lt;viewer&gt;');
    const successUpdate = update.mock.calls[0]?.[0] as unknown as {
      where: { id: string };
      data: { status: string; encryptedPayload: string; lastError: string | null };
    };
    expect(successUpdate.where.id).toBe('message-2');
    expect(successUpdate.data).toMatchObject({
      status: 'SENT',
      encryptedPayload: '',
      lastError: null,
    });
  });
});

function encrypt(payload: unknown): string {
  const iv = Buffer.alloc(12, 3);
  const cipher = createCipheriv('aes-256-gcm', mockEncryptionKey, iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
}
