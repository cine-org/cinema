import { Injectable } from '@nestjs/common';
import { SessionNotFoundException } from '../../domain';
import { AuthSessionWriteRepository } from '../ports';

export class RevokeSessionCommand {
  constructor(readonly props: { readonly accountId: string; readonly sessionId: string }) {}
}

@Injectable()
export class RevokeSessionHandler {
  constructor(private readonly sessions: AuthSessionWriteRepository) {}

  // The caller's current session may be revoked too; its access token stops working at once.
  async execute(command: RevokeSessionCommand): Promise<void> {
    const { accountId, sessionId } = command.props;
    const revoked = await this.sessions.revoke(accountId, sessionId, 'SESSION_DELETED', new Date());
    if (!revoked) throw new SessionNotFoundException();
  }
}
