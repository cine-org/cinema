export const AUTH_SESSION_POLICY = {
  accessTokenTtlSeconds: 15 * 60,
  // A session ends after this long without a refresh...
  idleTtlSeconds: 30 * 24 * 3600,
  // ...and this long after login, whatever happens.
  absoluteTtlSeconds: 90 * 24 * 3600,
  // A consumed refresh token presented again within this window is a concurrent refresh (two
  // tabs), not a replay: answered with a retry, the session stays.
  refreshReuseGraceSeconds: 30,
  // Logging in past this revokes the least recently refreshed sessions.
  maxActiveSessionsPerAccount: 3,
} as const;
