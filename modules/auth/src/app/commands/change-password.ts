import { Injectable } from '@nestjs/common';
import { TooManyRequestsException } from '@repo/common';
import { InvalidCurrentPasswordException } from '../../domain';
import { AccountWriteRepository, LoginLimiter, PasswordHasher } from '../ports';

export type ChangePasswordCommandProps = {
  readonly accountId: string;
  readonly currentPassword: string;
  readonly newPassword: string;
};

export class ChangePasswordCommand {
  constructor(readonly props: ChangePasswordCommandProps) {}
}

@Injectable()
export class ChangePasswordHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly hasher: PasswordHasher,
    private readonly limiter: LoginLimiter,
  ) {}

  // Ends every session, the caller's too: the user logs in again with the new password.
  async execute(command: ChangePasswordCommand): Promise<{ passwordChanged: true }> {
    const { accountId, currentPassword, newPassword } = command.props;
    const check = await this.accounts.findPasswordCheck(accountId);
    if (!check) throw new InvalidCurrentPasswordException();

    // Shares the email's login budget: a stolen access token cannot guess the password here
    // faster than at login.
    const limit = await this.limiter.takeAttempt(check.email);
    if (!limit.allowed) {
      throw new TooManyRequestsException({ retryAfterSeconds: limit.retryAfterSeconds });
    }
    if (!(await this.hasher.verify(check.passwordHash, currentPassword))) {
      throw new InvalidCurrentPasswordException();
    }

    const passwordHash = await this.hasher.hash(newPassword);
    const changed = await this.accounts.modify(accountId, (account) =>
      account.changePassword(check.passwordHash, passwordHash, new Date()),
    );
    // The password changed since it was checked (a reset, or another change), or the account is
    // gone: the current password given here no longer holds.
    if (!changed) throw new InvalidCurrentPasswordException();
    return { passwordChanged: true };
  }
}
