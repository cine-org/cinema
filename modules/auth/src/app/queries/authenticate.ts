import { Injectable } from '@nestjs/common';
import { InvalidAccessTokenException, SessionEndedException } from '../../domain';
import { AccessTokenIssuer, AuthSessionWriteRepository, type AccessTokenClaims } from '../ports';

export class AuthenticateQuery {
  constructor(readonly props: { readonly accessToken: string }) {}
}

// Checks the signature, then the session: a signed token outlives a revoked session, so the
// signature alone is not enough.
@Injectable()
export class AuthenticateHandler {
  constructor(
    private readonly accessTokens: AccessTokenIssuer,
    private readonly sessions: AuthSessionWriteRepository,
  ) {}

  async execute(query: AuthenticateQuery): Promise<AccessTokenClaims> {
    const claims = await this.accessTokens.verify(query.props.accessToken);
    if (!claims) throw new InvalidAccessTokenException();

    const state = await this.sessions.findGuardState(claims.sessionId);
    if (!state || state.accountId !== claims.accountId || state.accountDeletedAt) {
      throw new InvalidAccessTokenException();
    }
    if (state.revokedAt) throw new SessionEndedException(state.revokedReason);

    const now = new Date();
    if (now >= state.idleExpiresAt || now >= state.absoluteExpiresAt) {
      throw new SessionEndedException(null);
    }
    return claims;
  }
}
