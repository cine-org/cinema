import { Logger, type OnModuleDestroy } from '@nestjs/common';
import type { Email } from '@repo/common';
import nodemailer, { type SendMailOptions, type Transporter } from 'nodemailer';
import type { AuthMailer } from '../../app';

export type SmtpOptions = {
  readonly host: string;
  readonly port: number;
  // true: TLS from the first byte (465). false: STARTTLS, required (587).
  readonly secure: boolean;
  readonly user: string;
  readonly password: string;
  readonly from: string;
};

const SUPPORT_LINE = 'Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email.';

export class SmtpAuthMailer implements AuthMailer, OnModuleDestroy {
  private readonly logger = new Logger(SmtpAuthMailer.name);
  private readonly transport: Transporter;

  constructor(private readonly options: SmtpOptions) {
    this.transport = nodemailer.createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      requireTLS: !options.secure,
      auth: { user: options.user, pass: options.password },
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      dnsTimeout: 5_000,
      socketTimeout: 10_000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
  }

  sendVerificationCode(input: {
    to: Email;
    otp: string;
    verificationId: string;
    expiresInMinutes: number;
  }): void {
    const requestedAt = formatTime(new Date());
    const lines = [
      `Mã xác minh của bạn là: ${input.otp}`,
      `Mã có hiệu lực trong ${input.expiresInMinutes} phút. Chỉ mã mới nhất còn dùng được.`,
      `Yêu cầu lúc ${requestedAt}.`,
      SUPPORT_LINE,
    ];

    this.send(`verification ${input.verificationId}`, {
      to: input.to.value,
      subject: 'Mã xác minh tài khoản Cinema',
      text: lines.join('\n'),
      html: [
        '<p>Mã xác minh của bạn là:</p>',
        `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${input.otp}</p>`,
        ...lines.slice(1).map((line) => `<p>${line}</p>`),
      ].join(''),
    });
  }

  sendInvitation(input: {
    to: Email;
    otp: string;
    invitationId: string;
    roleName: string;
    expiresInHours: number;
  }): void {
    const requestedAt = formatTime(new Date());
    const lines = [
      `Bạn được mời làm ${input.roleName} trên hệ thống quản trị Cinema.`,
      `Mã kích hoạt tài khoản của bạn là: ${input.otp}`,
      `Mã có hiệu lực trong ${input.expiresInHours} giờ. Nhập mã và đặt mật khẩu để kích hoạt.`,
      `Lời mời lúc ${requestedAt}.`,
      SUPPORT_LINE,
    ];

    this.send(`invitation ${input.invitationId}`, {
      to: input.to.value,
      subject: 'Lời mời tham gia quản trị Cinema',
      text: lines.join('\n'),
      html: [
        `<p>${lines[0]}</p>`,
        '<p>Mã kích hoạt tài khoản của bạn là:</p>',
        `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${input.otp}</p>`,
        ...lines.slice(2).map((line) => `<p>${line}</p>`),
      ].join(''),
    });
  }

  sendPasswordResetCode(input: {
    to: Email;
    otp: string;
    resetId: string;
    expiresInMinutes: number;
  }): void {
    const requestedAt = formatTime(new Date());
    const lines = [
      `Mã đặt lại mật khẩu của bạn là: ${input.otp}`,
      `Mã có hiệu lực trong ${input.expiresInMinutes} phút. Chỉ mã mới nhất còn dùng được.`,
      'Sau khi đặt lại, mọi thiết bị đang đăng nhập sẽ bị đăng xuất.',
      `Yêu cầu lúc ${requestedAt}.`,
      SUPPORT_LINE,
    ];

    this.send(`password reset ${input.resetId}`, {
      to: input.to.value,
      subject: 'Mã đặt lại mật khẩu Cinema',
      text: lines.join('\n'),
      html: [
        '<p>Mã đặt lại mật khẩu của bạn là:</p>',
        `<p style="font-size:24px;font-weight:bold;letter-spacing:4px">${input.otp}</p>`,
        ...lines.slice(1).map((line) => `<p>${line}</p>`),
      ].join(''),
    });
  }

  onModuleDestroy(): void {
    this.transport.close();
  }

  // Fire-and-forget: the request never waits for SMTP. Logs carry no address or OTP.
  private send(label: string, message: SendMailOptions): void {
    this.transport
      .sendMail({ from: this.options.from, ...message })
      .then((info: { rejected?: unknown[] }) => {
        if (info.rejected?.length) this.logger.warn(`SMTP rejected ${label}`);
      })
      .catch((error: unknown) => {
        this.logger.warn(`SMTP failed for ${label}: ${smtpErrorCode(error)}`);
      });
  }
}

function formatTime(date: Date): string {
  return date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

// Codes only (ETIMEDOUT, EAUTH...): messages may echo addresses or server details.
function smtpErrorCode(error: unknown): string {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && /^[A-Z0-9_]{1,32}$/.test(code) ? code : 'UNKNOWN';
}
