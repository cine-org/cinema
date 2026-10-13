import { AUTH_SESSION_POLICY, type RefreshOutcome } from '@repo/auth';
import { setupAuth, type AuthSetup } from './setup';

describe('Prisma auth session repository (int)', () => {
  let t: AuthSetup;

  beforeAll(async () => {
    t = await setupAuth();
  });

  afterAll(() => t.close());

  describe('start', () => {
    it('saves the session with its first refresh token', async () => {
      const accountId = await t.createAccount();

      const { session, digest } = await t.login(accountId);

      const token = await t.db.authRefreshToken.findUnique({ where: { tokenDigest: digest } });
      expect(token).toMatchObject({ sessionId: session!.id, consumedAt: null });
    });

    it('keeps at most the limit of active sessions, even for concurrent logins', async () => {
      const accountId = await t.createAccount();
      const max = AUTH_SESSION_POLICY.maxActiveSessionsPerAccount;

      await Promise.all(Array.from({ length: max + 2 }, () => t.login(accountId)));

      expect(await t.activeSessions(accountId)).toHaveLength(max);
      const evicted = await t.db.authSession.count({
        where: { accountId, revokedReason: 'SESSION_LIMIT' },
      });
      expect(evicted).toBe(2);
    });

    it('refuses when the password is no longer the one checked at login', async () => {
      const accountId = await t.createAccount('hash-now');

      const { session } = await t.login(accountId, 'hash-before');

      expect(session).toBeNull();
      expect(await t.db.authSession.count({ where: { accountId } })).toBe(0);
    });

    it('refuses a deleted account', async () => {
      const accountId = await t.createAccount();
      await t.db.user.update({ where: { id: accountId }, data: { deletedAt: new Date() } });

      expect((await t.login(accountId)).session).toBeNull();
    });
  });

  describe('modifyByTokenDigest', () => {
    const refresh = (digest: string, sessionId: string) =>
      t.sessions.modifyByTokenDigest(digest, (session, presented) => {
        const next = t.refreshTokens.issue({ sessionId, now: new Date() });
        return session.refresh(presented, next.refreshToken, new Date());
      });

    it('rotates the token: the old one consumed, one new unconsumed token', async () => {
      const accountId = await t.createAccount();
      const { session, digest } = await t.login(accountId);

      expect(await refresh(digest, session!.id)).toBe('ROTATED');

      const tokens = await t.db.authRefreshToken.findMany({ where: { sessionId: session!.id } });
      expect(tokens).toHaveLength(2);
      expect(tokens.filter((token) => token.consumedAt === null)).toHaveLength(1);
      expect(tokens.find((token) => token.tokenDigest === digest)!.consumedAt).not.toBeNull();
    });

    it('lets only one of two concurrent refreshes rotate', async () => {
      const accountId = await t.createAccount();
      const { session, digest } = await t.login(accountId);

      const outcomes = await Promise.all([
        refresh(digest, session!.id),
        refresh(digest, session!.id),
      ]);

      expect([...outcomes].sort()).toEqual<(RefreshOutcome | null)[]>([
        'REUSED_IN_GRACE',
        'ROTATED',
      ]);
      const unconsumed = await t.db.authRefreshToken.count({
        where: { sessionId: session!.id, consumedAt: null },
      });
      expect(unconsumed).toBe(1);
    });

    it('revokes the session on a replay past the grace window', async () => {
      const accountId = await t.createAccount();
      const { session, digest } = await t.login(accountId);
      await refresh(digest, session!.id);
      const longAgo = new Date(
        Date.now() - (AUTH_SESSION_POLICY.refreshReuseGraceSeconds + 5) * 1000,
      );
      await t.db.authRefreshToken.update({
        where: { tokenDigest: digest },
        data: { consumedAt: longAgo },
      });

      expect(await refresh(digest, session!.id)).toBe('REPLAY');

      const saved = await t.db.authSession.findUniqueOrThrow({ where: { id: session!.id } });
      expect(saved.revokedReason).toBe('REPLAY');
    });

    it('returns null for an unknown token or a deleted account', async () => {
      const accountId = await t.createAccount();
      const { session, digest } = await t.login(accountId);

      expect(await refresh('0'.repeat(64), session!.id)).toBeNull();

      await t.db.user.update({ where: { id: accountId }, data: { deletedAt: new Date() } });
      expect(await refresh(digest, session!.id)).toBeNull();
    });
  });

  it('lets the database hold one unconsumed token per session', async () => {
    const accountId = await t.createAccount();
    const { session } = await t.login(accountId);

    await expect(
      t.db.authRefreshToken.create({
        data: { id: crypto.randomUUID(), sessionId: session!.id, tokenDigest: 'f'.repeat(64) },
      }),
    ).rejects.toThrow();
  });

  describe('revoke', () => {
    it('revokes only a session of the given account, once', async () => {
      const owner = await t.createAccount();
      const other = await t.createAccount();
      const { session } = await t.login(owner);

      expect(await t.sessions.revoke(other, session!.id, 'SESSION_DELETED', new Date())).toBe(
        false,
      );
      expect(await t.sessions.revoke(owner, session!.id, 'SESSION_DELETED', new Date())).toBe(true);
      expect(await t.sessions.revoke(owner, session!.id, 'LOGOUT', new Date())).toBe(false);

      const saved = await t.db.authSession.findUniqueOrThrow({ where: { id: session!.id } });
      expect(saved.revokedReason).toBe('SESSION_DELETED');
    });

    it('revokes every session of the account by logout-all', async () => {
      const accountId = await t.createAccount();
      await t.login(accountId);
      await t.login(accountId);

      expect(await t.sessions.revokeAll(accountId, 'LOGOUT_ALL', new Date())).toBe(2);
      expect(await t.activeSessions(accountId)).toHaveLength(0);
    });

    it('revokes the session of a refresh token by logout', async () => {
      const accountId = await t.createAccount();
      const { digest } = await t.login(accountId);

      expect(await t.sessions.revokeByTokenDigest(digest, 'LOGOUT', new Date())).toBe(true);
      expect(await t.sessions.revokeByTokenDigest(digest, 'LOGOUT', new Date())).toBe(false);
    });
  });

  it('reports the guard state with the account deletion', async () => {
    const accountId = await t.createAccount();
    const { session } = await t.login(accountId);
    await t.db.user.update({ where: { id: accountId }, data: { deletedAt: new Date() } });

    const state = await t.sessions.findGuardState(session!.id);

    expect(state).toMatchObject({ accountId, revokedAt: null });
    expect(state!.accountDeletedAt).toBeInstanceOf(Date);
  });
});
