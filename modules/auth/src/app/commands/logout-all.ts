import { Injectable } from '@nestjs/common';
import { AuthSessionWriteRepository } from '../ports';

export class LogoutAllCommand {
  constructor(readonly props: { readonly accountId: string }) {}
}

@Injectable()
export class LogoutAllHandler {
  constructor(private readonly sessions: AuthSessionWriteRepository) {}

  // The caller's own session included.
  async execute(command: LogoutAllCommand): Promise<{ revokedSessions: number }> {
    const revokedSessions = await this.sessions.revokeAll(
      command.props.accountId,
      'LOGOUT_ALL',
      new Date(),
    );
    return { revokedSessions };
  }
}
