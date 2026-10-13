import { Injectable } from '@nestjs/common';
import { InvalidEmailOtpException, OtpAttemptsExceededException } from '../../domain';
import { AccountWriteRepository, EmailOtpProtector } from '../ports';

export type VerifyEmailCommandProps = {
  readonly verificationId: string;
  readonly otp: string;
};

export class VerifyEmailCommand {
  constructor(readonly props: VerifyEmailCommandProps) {}
}

@Injectable()
export class VerifyEmailHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly otp: EmailOtpProtector,
  ) {}

  // Throws only after the attempt is saved, so a wrong OTP always counts.
  async execute(command: VerifyEmailCommand): Promise<{ isEmailVerified: true }> {
    const { verificationId, otp } = command.props;
    const owner = await this.accounts.findOwnerOfVerification(verificationId);
    if (!owner) throw new InvalidEmailOtpException();

    const result = await this.accounts.modify(owner.accountId, (account) =>
      account.verifyEmail(
        verificationId,
        (code) => this.otp.matches(code, account.email, otp),
        new Date(),
      ),
    );

    if (result === 'VERIFIED' || result === 'ALREADY_VERIFIED') return { isEmailVerified: true };
    if (result === 'TOO_MANY_ATTEMPTS') throw new OtpAttemptsExceededException();
    throw new InvalidEmailOtpException();
  }
}
