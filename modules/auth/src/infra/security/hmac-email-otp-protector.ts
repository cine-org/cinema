import { createHmac, randomInt, randomUUID, timingSafeEqual } from 'node:crypto';
import type { Email } from '@repo/common';
import type { EmailOtpProtector, IssuedEmailCode } from '../../app';
import { EmailCode, type EmailCodePurpose } from '../../domain';

const OTP_PATTERN = /^\d{6}$/;
const MIN_KEY_BYTES = 32;

// OTPs are stored as HMAC-SHA256 over the code id, account, purpose, email and OTP. Binding the
// email means a code stops matching if the account's email ever changes; binding the purpose means
// a verification code can never reset a password.
export class HmacEmailOtpProtector implements EmailOtpProtector {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, 'base64');
    // Canonical check: Node silently skips invalid base64 characters.
    if (this.key.length < MIN_KEY_BYTES || this.key.toString('base64') !== base64Key) {
      throw new Error(`OTP key must be base64 of at least ${MIN_KEY_BYTES} random bytes`);
    }
  }

  issue(input: {
    accountId: string;
    email: Email;
    purpose: EmailCodePurpose;
    now: Date;
  }): IssuedEmailCode {
    const id = randomUUID();
    const otp = randomInt(0, 1_000_000).toString().padStart(6, '0');

    return {
      otp,
      code: EmailCode.issue({
        id,
        accountId: input.accountId,
        purpose: input.purpose,
        secretDigest: this.digest(id, input.accountId, input.purpose, input.email, otp),
        now: input.now,
      }),
    };
  }

  matches(code: EmailCode, email: Email, otp: string): boolean {
    if (!OTP_PATTERN.test(otp)) return false;

    const actual = Buffer.from(
      this.digest(code.id, code.accountId, code.purpose, email, otp),
      'hex',
    );
    const expected = Buffer.from(code.secretDigest, 'hex');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  }

  private digest(
    id: string,
    accountId: string,
    purpose: EmailCodePurpose,
    email: Email,
    otp: string,
  ): string {
    return createHmac('sha256', this.key)
      .update(JSON.stringify([id, accountId, purpose, email.value, otp]))
      .digest('hex');
  }
}
