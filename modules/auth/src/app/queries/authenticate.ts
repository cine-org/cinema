import { Injectable } from '@nestjs/common';
import {
  canSignInOn,
  InvalidAccessTokenException,
  SessionEndedException,
  type AuthSessionSurface,
} from '../../domain';
import {
  AccessTokenIssuer,
  AuthSessionWriteRepository,
  type AccessTokenClaims,
  type AccountGrant,
} from '../ports';

export class AuthenticateQuery {
  constructor(
    readonly props: { readonly accessToken: string; readonly surface: AuthSessionSurface },
  ) {}
}

export type AuthenticatedAccount = AccessTokenClaims & {
  readonly role: AccountGrant;
};

// Checks the signature, then the session: a signed token outlives a revoked session, so the
// signature alone is not enough.
@Injectable()
export class AuthenticateHandler {
  constructor(
    private readonly accessTokens: AccessTokenIssuer,
    private readonly sessions: AuthSessionWriteRepository,
  ) {}

  async execute(query: AuthenticateQuery): Promise<AuthenticatedAccount> {
    const { accessToken, surface } = query.props;
    const claims = await this.accessTokens.verify(accessToken, surface);
    if (!claims) throw new InvalidAccessTokenException();

    const state = await this.sessions.findGuardState(claims.sessionId);
    if (
      !state ||
      state.accountId !== claims.accountId ||
      state.surface !== surface ||
      state.accountDeletedAt ||
      // The role was revoked or changed side since login.
      !state.role ||
      !canSignInOn(surface, state.role)
    ) {
      throw new InvalidAccessTokenException();
    }
    if (state.revokedAt) throw new SessionEndedException(state.revokedReason);

    const now = new Date();
    if (now >= state.idleExpiresAt || now >= state.absoluteExpiresAt) {
      throw new SessionEndedException(null);
    }
    return { ...claims, role: state.role };
  }
}
