import { describe, expect, it } from 'vitest';
import { AUTH_SESSION_POLICY, AuthSession } from '../../../src/domain';
import { at, NOW, refreshToken, sessionWith, startedSession } from '../../fixtures';

const DAY = 24 * 3600;

describe('AuthSession', () => {
  it('starts active, with idle and absolute expiry from login', () => {
    const session = startedSession();

    expect(session.isActiveAt(NOW)).toBe(true);
    expect(session.lastRefreshedAt).toEqual(NOW);
    expect(session.idleExpiresAt).toEqual(at(NOW, AUTH_SESSION_POLICY.idleTtlSeconds));
    expect(session.absoluteExpiresAt).toEqual(at(NOW, AUTH_SESSION_POLICY.absoluteTtlSeconds));
    expect(session.issuedRefreshToken?.sessionId).toBe(session.id);
  });

  it.each([
    ['at the idle expiry', { idleExpiresAt: NOW }],
    ['at the absolute expiry', { absoluteExpiresAt: NOW }],
    ['once revoked', { revokedAt: at(NOW, -1), revokedReason: 'LOGOUT' as const }],
  ])('is inactive %s', (_, overrides) => {
    expect(sessionWith(overrides).isActiveAt(NOW)).toBe(false);
  });

  describe('refresh', () => {
    it('rotates: consumes the presented token, issues the next and extends idle expiry', () => {
      const session = sessionWith();
      const presented = refreshToken(session.id);
      const next = refreshToken(session.id);
      const later = at(NOW, DAY);

      expect(session.refresh(presented, next, later)).toBe('ROTATED');

      expect(presented.consumedAt).toEqual(later);
      expect(session.issuedRefreshToken).toBe(next);
      expect(session.lastRefreshedAt).toEqual(later);
      expect(session.idleExpiresAt).toEqual(at(later, AUTH_SESSION_POLICY.idleTtlSeconds));
    });

    it('never extends idle expiry past the absolute expiry', () => {
      const session = sessionWith({ absoluteExpiresAt: at(NOW, 10 * DAY) });

      session.refresh(refreshToken(session.id), refreshToken(session.id), NOW);

      expect(session.idleExpiresAt).toEqual(at(NOW, 10 * DAY));
    });

    it('treats a token consumed within the grace window as a concurrent refresh', () => {
      const session = sessionWith();
      const presented = refreshToken(session.id);
      presented.consume(NOW);
      const within = at(NOW, AUTH_SESSION_POLICY.refreshReuseGraceSeconds);

      expect(session.refresh(presented, refreshToken(session.id), within)).toBe('REUSED_IN_GRACE');
      expect(session.isActiveAt(within)).toBe(true);
      expect(session.issuedRefreshToken).toBeNull();
    });

    it('revokes the session when a consumed token is replayed after the grace window', () => {
      const session = sessionWith();
      const presented = refreshToken(session.id);
      presented.consume(NOW);
      const after = at(NOW, AUTH_SESSION_POLICY.refreshReuseGraceSeconds + 1);

      expect(session.refresh(presented, refreshToken(session.id), after)).toBe('REPLAY');
      expect(session.revokedReason).toBe('REPLAY');
      expect(session.issuedRefreshToken).toBeNull();
    });

    it('does nothing on an inactive session', () => {
      const session = sessionWith({ revokedAt: NOW, revokedReason: 'LOGOUT' });
      const presented = refreshToken(session.id);

      expect(session.refresh(presented, refreshToken(session.id), NOW)).toBe('INACTIVE');
      expect(presented.consumedAt).toBeNull();
      expect(session.revokedReason).toBe('LOGOUT');
    });
  });

  it('keeps the reason of the first revocation', () => {
    const session = sessionWith();

    session.revoke('SESSION_LIMIT', NOW);
    session.revoke('LOGOUT', at(NOW, 5));

    expect(session.revokedReason).toBe('SESSION_LIMIT');
    expect(session.revokedAt).toEqual(NOW);
  });

  describe('makeRoomForLogin', () => {
    const max = AUTH_SESSION_POLICY.maxActiveSessionsPerAccount;

    it('revokes nothing below the limit', () => {
      const active = Array.from({ length: max - 1 }, () => sessionWith());

      expect(AuthSession.makeRoomForLogin(active, NOW)).toEqual([]);
    });

    it('revokes the least recently refreshed sessions to leave room for one more', () => {
      const oldest = sessionWith({ lastRefreshedAt: at(NOW, -3 * DAY) });
      const older = sessionWith({ lastRefreshedAt: at(NOW, -2 * DAY) });
      const recent = Array.from({ length: max - 1 }, (_, i) =>
        sessionWith({ lastRefreshedAt: at(NOW, -i) }),
      );

      const evicted = AuthSession.makeRoomForLogin([...recent, older, oldest], NOW);

      expect(evicted).toEqual([oldest, older]);
      expect(evicted.every((s) => s.revokedReason === 'SESSION_LIMIT')).toBe(true);
      expect(recent.every((s) => s.revokedAt === null)).toBe(true);
    });
  });
});
