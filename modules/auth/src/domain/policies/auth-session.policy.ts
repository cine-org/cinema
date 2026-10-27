export const AUTH_SESSION_SURFACE = {
  // Customers, on the user API.
  USER: 'USER',
  // Internal accounts, on the admin API.
  ADMIN: 'ADMIN',
} as const;

export type AuthSessionSurface = (typeof AUTH_SESSION_SURFACE)[keyof typeof AUTH_SESSION_SURFACE];

export type SessionLifetime = {
  // A session ends after this long without a refresh...
  readonly idleTtlSeconds: number;
  // ...and this long after login, whatever happens.
  readonly absoluteTtlSeconds: number;
};

export const AUTH_SESSION_POLICY = {
  accessTokenTtlSeconds: 15 * 60,
  // Internal accounts can do far more, so their sessions are much shorter.
  lifetimes: {
    USER: { idleTtlSeconds: 30 * 24 * 3600, absoluteTtlSeconds: 90 * 24 * 3600 },
    ADMIN: { idleTtlSeconds: 12 * 3600, absoluteTtlSeconds: 7 * 24 * 3600 },
  } satisfies Record<AuthSessionSurface, SessionLifetime>,
  // A consumed refresh token presented again within this window is a concurrent refresh (two
  // tabs), not a replay: answered with a retry, the session stays.
  refreshReuseGraceSeconds: 30,
  // Logging in past this revokes the least recently refreshed sessions.
  maxActiveSessionsPerAccount: 3,
} as const;
