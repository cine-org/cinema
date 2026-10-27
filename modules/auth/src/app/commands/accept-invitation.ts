import { Injectable } from '@nestjs/common';
import { InvalidEmailOtpException, OtpAttemptsExceededException } from '../../domain';
import { AccountWriteRepository, EmailOtpProtector, PasswordHasher } from '../ports';

export type AcceptInvitationCommandProps = {
  readonly invitationId: string;
  readonly otp: string;
  readonly password: string;
};

export class AcceptInvitationCommand {
  constructor(readonly props: AcceptInvitationCommandProps) {}
}

@Injectable()
export class AcceptInvitationHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly otp: EmailOtpProtector,
    private readonly hasher: PasswordHasher,
  ) {}

  // Sets the password and verifies the email; the invitee then signs in on the admin side. Throws
  // only after the attempt is saved, so a wrong OTP always counts.
  async execute(command: AcceptInvitationCommand): Promise<{ accepted: true }> {
    const { invitationId, otp, password } = command.props;
    const owner = await this.accounts.findOwnerOfInvitation(invitationId);
    if (!owner) throw new InvalidEmailOtpException();

    // Outside the lock: Argon2 is slow and the row would stay locked meanwhile.
    const passwordHash = await this.hasher.hash(password);
    const result = await this.accounts.modify(owner.accountId, (account) =>
      account.acceptInvitation(
        invitationId,
        (code) => this.otp.matches(code, account.email, otp),
        passwordHash,
        new Date(),
      ),
    );

    if (result === 'ACCEPTED') return { accepted: true };
    if (result === 'TOO_MANY_ATTEMPTS') throw new OtpAttemptsExceededException();
    throw new InvalidEmailOtpException();
  }
}
