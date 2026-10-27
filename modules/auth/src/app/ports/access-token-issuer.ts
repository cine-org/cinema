import type { AuthSessionSurface } from '../../domain';

export type IssuedAccessToken = {
  readonly token: string;
  readonly expiresAt: Date;
};

export type AccessTokenClaims = {
  readonly accountId: string;
  readonly sessionId: string;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class AccessTokenIssuer {
  // The audience is the surface: a customer token is never accepted by the admin API.
  abstract issue(
    input: AccessTokenClaims & { surface: AuthSessionSurface; now: Date },
  ): Promise<IssuedAccessToken>;
  // Null for a bad signature, wrong issuer or audience, or an expired token. The session still
  // has to be checked: a valid token outlives a revoked session.
  abstract verify(token: string, surface: AuthSessionSurface): Promise<AccessTokenClaims | null>;
}
