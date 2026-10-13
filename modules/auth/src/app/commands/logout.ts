import { Injectable } from '@nestjs/common';
import { AuthSessionWriteRepository, RefreshTokenProtector } from '../ports';

export class LogoutCommand {
  constructor(readonly props: { readonly refreshToken: string | null }) {}
}

@Injectable()
export class LogoutHandler {
  constructor(
    private readonly sessions: AuthSessionWriteRepository,
    private readonly refreshTokens: RefreshTokenProtector,
  ) {}

  // Always succeeds: a missing, unknown or already revoked token leaves nothing to log out.
  async execute(command: LogoutCommand): Promise<void> {
    const { refreshToken } = command.props;
    const digest = refreshToken ? this.refreshTokens.digest(refreshToken) : null;
    if (!digest) return;
    await this.sessions.revokeByTokenDigest(digest, 'LOGOUT', new Date());
  }
}
