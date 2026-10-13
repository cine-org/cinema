import { Injectable } from '@nestjs/common';
import { EMAIL_CODE_PURPOSE, EMAIL_VERIFICATION_POLICY } from '../../domain';
import {
  AccountWriteRepository,
  AuthMailer,
  EmailOtpProtector,
  EmailVerificationLimiter,
} from '../ports';
import {
  decoyVerification,
  takeIssuanceOrThrow,
  verificationAccepted,
  type VerificationAccepted,
} from './verification-accepted';

export type ResendVerificationEmailCommandProps = {
  // The latest id the client holds; the answer carries the new one.
  readonly verificationId: string;
};

export class ResendVerificationEmailCommand {
  constructor(readonly props: ResendVerificationEmailCommandProps) {}
}

@Injectable()
export class ResendVerificationEmailHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly otp: EmailOtpProtector,
    private readonly limiter: EmailVerificationLimiter,
    private readonly mailer: AuthMailer,
  ) {}

  async execute(command: ResendVerificationEmailCommand): Promise<VerificationAccepted> {
    const { verificationId } = command.props;
    const owner = await this.accounts.findOwnerOfVerification(verificationId);
    // Checked before the quota, so a stale or unknown id costs the account nothing.
    if (!owner?.canResend) return decoyVerification();

    await takeIssuanceOrThrow(this.limiter, owner.email);

    const now = new Date();
    const issued = this.otp.issue({
      accountId: owner.accountId,
      email: owner.email,
      purpose: EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION,
      now,
    });
    const resent = await this.accounts.modify(owner.accountId, (account) =>
      account.resendCode(verificationId, issued.code, now),
    );
    // Verified, or someone re-registered since this code was issued.
    if (!resent) return decoyVerification();

    this.mailer.sendVerificationCode({
      to: owner.email,
      otp: issued.otp,
      verificationId: issued.code.id,
      expiresInMinutes: EMAIL_VERIFICATION_POLICY.otpTtlSeconds / 60,
    });
    return verificationAccepted(issued.code.id);
  }
}
