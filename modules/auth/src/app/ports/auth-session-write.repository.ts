import type { AuthSession, AuthSessionRevokedReason, RefreshToken } from '../../domain';

// What the Bearer guard needs to accept an access token's session.
export type SessionGuardState = {
  readonly accountId: string;
  readonly idleExpiresAt: Date;
  readonly absoluteExpiresAt: Date;
  readonly revokedAt: Date | null;
  readonly revokedReason: AuthSessionRevokedReason | null;
  readonly accountDeletedAt: Date | null;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class AuthSessionWriteRepository {
  // Reads the primary: a replica lagging behind a revocation would let the session through.
  abstract findGuardState(sessionId: string): Promise<SessionGuardState | null>;
  // Locks the account, loads its active sessions and saves what `open` revoked plus the session it
  // returns, with its first refresh token, in one transaction. Null if the account is gone or its
  // password is no longer `verifiedHash`: a login racing a reset must not outlive it.
  abstract start(
    accountId: string,
    verifiedHash: string,
    now: Date,
    open: (active: AuthSession[]) => AuthSession,
  ): Promise<AuthSession | null>;
  // Locks the session owning the token, applies `change` and saves it in one transaction. Null if
  // no token has this digest or its account is deleted. `change` must not throw for business
  // outcomes, or the save is rolled back.
  abstract modifyByTokenDigest<T>(
    digest: string,
    change: (session: AuthSession, presented: RefreshToken) => T,
  ): Promise<T | null>;
  // The revoke methods leave already revoked sessions, and their reason, as they are.
  // False if the token is unknown or its session was already revoked.
  abstract revokeByTokenDigest(
    digest: string,
    reason: AuthSessionRevokedReason,
    now: Date,
  ): Promise<boolean>;
  // False if the account has no such unrevoked session.
  abstract revoke(
    accountId: string,
    sessionId: string,
    reason: AuthSessionRevokedReason,
    now: Date,
  ): Promise<boolean>;
  // Number of sessions revoked.
  abstract revokeAll(
    accountId: string,
    reason: AuthSessionRevokedReason,
    now: Date,
  ): Promise<number>;
}
