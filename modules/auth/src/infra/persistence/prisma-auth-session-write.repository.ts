import { Injectable } from '@nestjs/common';
import { DatabaseWriteClient, type Prisma } from '@repo/database';
import type { AuthSessionWriteRepository, SessionGuardState } from '../../app';
import type { AuthSession, AuthSessionRevokedReason, RefreshToken } from '../../domain';
import { PrismaAuthSessionMapper } from './prisma-auth-session.mapper';
import { transactionWithLockTimeout } from './transaction-with-lock-timeout';

@Injectable()
export class PrismaAuthSessionWriteRepository implements AuthSessionWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findGuardState(sessionId: string): Promise<SessionGuardState | null> {
    const row = await this.db.authSession.findUnique({
      where: { id: sessionId },
      select: {
        accountId: true,
        idleExpiresAt: true,
        absoluteExpiresAt: true,
        revokedAt: true,
        revokedReason: true,
        account: { select: { deletedAt: true } },
      },
    });
    if (!row) return null;

    const { account, ...session } = row;
    return { ...session, accountDeletedAt: account.deletedAt };
  }

  async start(
    accountId: string,
    verifiedHash: string,
    now: Date,
    open: (active: AuthSession[]) => AuthSession,
  ): Promise<AuthSession | null> {
    return transactionWithLockTimeout(this.db, async (tx) => {
      // Serializes logins of one account, so they cannot together go over the session limit.
      // NO KEY UPDATE: inserting sessions that reference the user is still allowed.
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM users
        WHERE id = ${accountId} AND deleted_at IS NULL AND password_hash = ${verifiedHash}
        FOR NO KEY UPDATE`;
      if (locked.length === 0) return null;

      const rows = await tx.authSession.findMany({
        where: {
          accountId,
          revokedAt: null,
          idleExpiresAt: { gt: now },
          absoluteExpiresAt: { gt: now },
        },
      });
      const active = rows.map((row) => PrismaAuthSessionMapper.toSession(row));
      const session = open(active);

      const first = session.issuedRefreshToken;
      if (!first) throw new Error('A new session needs a refresh token');

      for (const evicted of active.filter((s) => s.revokedAt)) {
        await tx.authSession.update({
          where: { id: evicted.id },
          data: PrismaAuthSessionMapper.toSessionUpdate(evicted),
        });
      }
      await tx.authSession.create({ data: PrismaAuthSessionMapper.toSessionCreate(session) });
      await tx.authRefreshToken.create({
        data: PrismaAuthSessionMapper.toRefreshTokenCreate(first),
      });
      return session;
    });
  }

  async modifyByTokenDigest<T>(
    digest: string,
    change: (session: AuthSession, presented: RefreshToken) => T,
  ): Promise<T | null> {
    return transactionWithLockTimeout(this.db, async (tx) => {
      const found = await tx.authRefreshToken.findUnique({
        where: { tokenDigest: digest },
        select: {
          sessionId: true,
          session: { select: { account: { select: { deletedAt: true } } } },
        },
      });
      if (!found || found.session.account.deletedAt) return null;

      // Concurrent refreshes of one session run one after the other: the later one sees the
      // token already consumed.
      await tx.$queryRaw`SELECT id FROM auth_sessions WHERE id = ${found.sessionId} FOR UPDATE`;

      const row = await tx.authSession.findUniqueOrThrow({ where: { id: found.sessionId } });
      const tokenRow = await tx.authRefreshToken.findUniqueOrThrow({
        where: { tokenDigest: digest },
      });
      const session = PrismaAuthSessionMapper.toSession(row);
      const presented = PrismaAuthSessionMapper.toRefreshToken(tokenRow);

      const result = change(session, presented);
      await save(tx, session, row, presented, tokenRow.consumedAt);
      return result;
    });
  }

  async revokeByTokenDigest(
    digest: string,
    reason: AuthSessionRevokedReason,
    now: Date,
  ): Promise<boolean> {
    const { count } = await this.db.authSession.updateMany({
      where: { revokedAt: null, refreshTokens: { some: { tokenDigest: digest } } },
      data: { revokedAt: now, revokedReason: reason },
    });
    return count > 0;
  }

  async revoke(
    accountId: string,
    sessionId: string,
    reason: AuthSessionRevokedReason,
    now: Date,
  ): Promise<boolean> {
    const { count } = await this.db.authSession.updateMany({
      where: { id: sessionId, accountId, revokedAt: null },
      data: { revokedAt: now, revokedReason: reason },
    });
    return count > 0;
  }

  async revokeAll(accountId: string, reason: AuthSessionRevokedReason, now: Date): Promise<number> {
    const { count } = await this.db.authSession.updateMany({
      where: { accountId, revokedAt: null },
      data: { revokedAt: now, revokedReason: reason },
    });
    return count;
  }
}

// Writes only what the change touched. The presented token is consumed before the next one is
// inserted: the database allows one unconsumed token per session.
async function save(
  tx: Prisma.TransactionClient,
  session: AuthSession,
  before: Prisma.AuthSessionModel,
  presented: RefreshToken,
  presentedConsumedAt: Date | null,
): Promise<void> {
  const sessionChanged =
    session.lastRefreshedAt !== before.lastRefreshedAt ||
    session.idleExpiresAt !== before.idleExpiresAt ||
    session.revokedAt !== before.revokedAt;
  if (sessionChanged) {
    await tx.authSession.update({
      where: { id: session.id },
      data: PrismaAuthSessionMapper.toSessionUpdate(session),
    });
  }

  if (presented.consumedAt !== presentedConsumedAt) {
    await tx.authRefreshToken.update({
      where: { id: presented.id },
      data: { consumedAt: presented.consumedAt },
    });
  }

  const next = session.issuedRefreshToken;
  if (next) {
    await tx.authRefreshToken.create({ data: PrismaAuthSessionMapper.toRefreshTokenCreate(next) });
  }
}
