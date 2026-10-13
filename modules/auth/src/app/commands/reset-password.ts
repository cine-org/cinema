import { Injectable } from '@nestjs/common';
import { InvalidEmailOtpException, OtpAttemptsExceededException } from '../../domain';
import { AccountWriteRepository, EmailOtpProtector, PasswordHasher } from '../ports';

export type ResetPasswordCommandProps = {
  readonly resetId: string;
  readonly otp: string;
  readonly newPassword: string;
};

export class ResetPasswordCommand {
  constructor(readonly props: ResetPasswordCommandProps) {}
}

@Injectable()
export class ResetPasswordHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly otp: EmailOtpProtector,
    private readonly hasher: PasswordHasher,
  ) {}

  // Ends every session of the account; the user logs in again with the new password. Throws only
  // after the attempt is saved, so a wrong OTP always counts.
  async execute(command: ResetPasswordCommand): Promise<{ passwordReset: true }> {
    const { resetId, otp, newPassword } = command.props;
    const owner = await this.accounts.findOwnerOfPasswordReset(resetId);
    if (!owner) throw new InvalidEmailOtpException();

    // Outside the lock: Argon2 is slow and the row would stay locked meanwhile.
    const passwordHash = await this.hasher.hash(newPassword);
    const result = await this.accounts.modify(owner.accountId, (account) =>
      account.resetPassword(
        resetId,
        (code) => this.otp.matches(code, account.email, otp),
        passwordHash,
        new Date(),
      ),
    );

    if (result === 'RESET') return { passwordReset: true };
    if (result === 'TOO_MANY_ATTEMPTS') throw new OtpAttemptsExceededException();
    throw new InvalidEmailOtpException();
  }
}
