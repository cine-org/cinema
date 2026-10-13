import type { Email } from '@repo/common';

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
// Sending is fire-and-forget: methods return at once and failures are only logged.
export abstract class AuthMailer {
  abstract sendVerificationCode(input: {
    to: Email;
    otp: string;
    verificationId: string;
    expiresInMinutes: number;
  }): void;
  abstract sendPasswordResetCode(input: {
    to: Email;
    otp: string;
    resetId: string;
    expiresInMinutes: number;
  }): void;
}
