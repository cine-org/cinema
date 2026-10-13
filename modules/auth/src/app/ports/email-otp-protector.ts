import type { Email } from '@repo/common';
import type { EmailCode, EmailCodePurpose } from '../../domain';

export type IssuedEmailCode = {
  readonly code: EmailCode;
  // Plain OTP for the email; never stored.
  readonly otp: string;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class EmailOtpProtector {
  abstract issue(input: {
    accountId: string;
    email: Email;
    purpose: EmailCodePurpose;
    now: Date;
  }): IssuedEmailCode;
  abstract matches(code: EmailCode, email: Email, otp: string): boolean;
}
