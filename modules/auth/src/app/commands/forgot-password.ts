import { Injectable } from '@nestjs/common';
import { Email, TooManyRequestsException } from '@repo/common';
import { EMAIL_CODE_PURPOSE, PASSWORD_RESET_POLICY } from '../../domain';
import {
  AccountWriteRepository,
  AuthMailer,
  EmailOtpProtector,
  EmailVerificationLimiter,
} from '../ports';

export type PasswordResetAccepted = {
  readonly resetId: string;
  readonly expiresInSeconds: number;
  readonly resendAfterSeconds: number;
};

export class ForgotPasswordCommand {
  constructor(readonly props: { readonly email: string }) {}
}

function accepted(resetId: string): PasswordResetAccepted {
  return {
    resetId,
    expiresInSeconds: PASSWORD_RESET_POLICY.otpTtlSeconds,
    resendAfterSeconds: PASSWORD_RESET_POLICY.cooldown.refillIntervalMs / 1000,
  };
}

// Same answer whether or not the email has an account: unknown and deleted accounts get an id
// pointing nowhere and no email. Unverified accounts get a code: entering it verifies the email.
@Injectable()
export class ForgotPasswordHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly otp: EmailOtpProtector,
    private readonly limiter: EmailVerificationLimiter,
    private readonly mailer: AuthMailer,
  ) {}

  async execute(command: ForgotPasswordCommand): Promise<PasswordResetAccepted> {
    const email = Email.create(command.props.email);

    // Before the lookup, so a 429 does not tell which emails have an account.
    const limit = await this.limiter.takePasswordResetIssuance(email);
    if (!limit.allowed) {
      throw new TooManyRequestsException({
        message: 'Please wait before requesting another code',
        retryAfterSeconds: limit.retryAfterSeconds,
      });
    }

    const existing = await this.accounts.findRegistrationByEmail(email);
    if (!existing || existing.deletedAt) return accepted(crypto.randomUUID());

    const now = new Date();
    const issued = this.otp.issue({
      accountId: existing.id,
      email,
      purpose: EMAIL_CODE_PURPOSE.PASSWORD_RESET,
      now,
    });
    const requested = await this.accounts.modify(existing.id, (account) => {
      account.requestPasswordReset(issued.code, now);
      return true;
    });
    // Deleted since the lookup.
    if (!requested) return accepted(crypto.randomUUID());

    this.mailer.sendPasswordResetCode({
      to: email,
      otp: issued.otp,
      resetId: issued.code.id,
      expiresInMinutes: PASSWORD_RESET_POLICY.otpTtlSeconds / 60,
    });
    return accepted(issued.code.id);
  }
}
