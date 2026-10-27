import { Injectable } from '@nestjs/common';
import {
  canSignInOn,
  InvalidRefreshTokenException,
  RefreshTokenReusedException,
  SessionEndedException,
  type AuthSessionRevokedReason,
  type AuthSessionSurface,
  type RefreshOutcome,
} from '../../domain';
import {
  AccessTokenIssuer,
  AuthSessionWriteRepository,
  RefreshTokenProtector,
  type IssuedRefreshToken,
} from '../ports';
import type { SessionTokens } from './session-tokens';

export class RefreshCommand {
  constructor(
    readonly props: { readonly refreshToken: string | null; readonly surface: AuthSessionSurface },
  ) {}
}

@Injectable()
export class RefreshHandler {
  constructor(
    private readonly sessions: AuthSessionWriteRepository,
    private readonly refreshTokens: RefreshTokenProtector,
    private readonly accessTokens: AccessTokenIssuer,
  ) {}

  // Throws only after the outcome is saved, so a replay always revokes the session.
  async execute(command: RefreshCommand): Promise<SessionTokens> {
    const { refreshToken, surface } = command.props;
    const digest = refreshToken ? this.refreshTokens.digest(refreshToken) : null;
    if (!digest) throw new InvalidRefreshTokenException();

    const now = new Date();
    const result = await this.sessions.modifyByTokenDigest(digest, (session, presented, owner) => {
      // A cookie of the other side, or an account whose role no longer belongs here: refused
      // without touching the session.
      if (session.surface !== surface || !canSignInOn(surface, owner.role)) return null;
      const next = this.refreshTokens.issue({ sessionId: session.id, now });
      return {
        outcome: session.refresh(presented, next.refreshToken, now),
        next,
        accountId: session.accountId,
        sessionId: session.id,
        surface: session.surface,
        idleExpiresAt: session.idleExpiresAt,
        revokedReason: session.revokedReason,
      };
    });
    if (!result) throw new InvalidRefreshTokenException();

    throwUnlessRotated(result.outcome, result.revokedReason);
    return this.tokens(result, now);
  }

  private async tokens(
    rotated: {
      next: IssuedRefreshToken;
      accountId: string;
      sessionId: string;
      surface: AuthSessionSurface;
      idleExpiresAt: Date;
    },
    now: Date,
  ): Promise<SessionTokens> {
    const access = await this.accessTokens.issue({
      accountId: rotated.accountId,
      sessionId: rotated.sessionId,
      surface: rotated.surface,
      now,
    });
    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: rotated.next.token,
      refreshTokenExpiresAt: rotated.idleExpiresAt,
    };
  }
}

function throwUnlessRotated(
  outcome: RefreshOutcome,
  revokedReason: AuthSessionRevokedReason | null,
): void {
  if (outcome === 'ROTATED') return;
  if (outcome === 'REUSED_IN_GRACE') throw new RefreshTokenReusedException();
  // REPLAY revoked the session just now; INACTIVE was revoked before (reason kept) or expired.
  throw new SessionEndedException(revokedReason);
}
