import { Injectable } from '@nestjs/common';
import { Account, EmailAlreadyExistsException } from '../../domain';
import { AccountReadRepository, AccountWriteRepository, PasswordHasher } from '../ports';

export type RegisterCommandProps = {
  readonly email: string;
  readonly password: string;
  readonly fullName?: string | null;
};

export class RegisterCommand {
  constructor(readonly props: RegisterCommandProps) {}
}

export type RegisterResult = {
  readonly id: string;
};

@Injectable()
export class RegisterHandler {
  constructor(
    private readonly reader: AccountReadRepository,
    private readonly writer: AccountWriteRepository,
    private readonly hasher: PasswordHasher,
  ) {}

  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const email = Account.normalizeEmail(command.props.email);

    // Early, friendly check; the unique index on email is what actually decides.
    if (await this.reader.existsByEmail(email)) {
      throw new EmailAlreadyExistsException();
    }

    const account = Account.register({
      email,
      passwordHash: await this.hasher.hash(command.props.password),
      fullName: command.props.fullName,
    });

    await this.writer.save(account);

    return { id: account.id };
  }
}
