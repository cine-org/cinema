import { Injectable } from '@nestjs/common';
import { Email } from '@repo/common';
import { AdminExistsException } from '@repo/iam';
import { Account, EMAIL_CODE_PURPOSE } from '../../domain';
import { AccountWriteRepository, EmailOtpProtector, PasswordHasher } from '../ports';

export type CreateFirstAdminCommandProps = {
  readonly email: string;
  readonly password: string;
  readonly fullName?: string | null;
};

export class CreateFirstAdminCommand {
  constructor(readonly props: CreateFirstAdminCommandProps) {}
}

// Bootstraps an environment, run from a server shell (CLI): every later internal account comes by
// invitation from an admin. Refuses once any admin exists.
@Injectable()
export class CreateFirstAdminHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly hasher: PasswordHasher,
    private readonly otp: EmailOtpProtector,
  ) {}

  async execute(command: CreateFirstAdminCommand): Promise<{ accountId: string }> {
    const email = Email.create(command.props.email);
    const id = Account.newId();
    // The account entity needs a first code; it is accepted at once, so it is never emailed.
    const issued = this.otp.issue({
      accountId: id,
      email,
      purpose: EMAIL_CODE_PURPOSE.ACCOUNT_INVITATION,
      now: new Date(),
    });
    const passwordHash = await this.hasher.hash(command.props.password);
    const account = Account.invite({
      id,
      email,
      fullName: command.props.fullName,
      passwordHash,
      invitation: issued.code,
    });
    account.acceptInvitation(issued.code.id, () => true, passwordHash, new Date());

    if ((await this.accounts.createFirstAdmin(account)) === 'ADMIN_EXISTS') {
      throw new AdminExistsException();
    }
    return { accountId: id };
  }
}
