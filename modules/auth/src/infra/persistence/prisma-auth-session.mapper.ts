import type { Prisma } from '@repo/database';
import { AuthSession, RefreshToken } from '../../domain';

export class PrismaAuthSessionMapper {
  static toSession(row: Prisma.AuthSessionModel): AuthSession {
    return AuthSession.restore({
      id: row.id,
      accountId: row.accountId,
      createdAt: row.createdAt,
      lastRefreshedAt: row.lastRefreshedAt,
      idleExpiresAt: row.idleExpiresAt,
      absoluteExpiresAt: row.absoluteExpiresAt,
      revokedAt: row.revokedAt,
      revokedReason: row.revokedReason,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
    });
  }

  static toRefreshToken(row: Prisma.AuthRefreshTokenModel): RefreshToken {
    return RefreshToken.restore({
      id: row.id,
      sessionId: row.sessionId,
      digest: row.tokenDigest,
      createdAt: row.createdAt,
      consumedAt: row.consumedAt,
    });
  }

  static toSessionCreate(session: AuthSession): Prisma.AuthSessionUncheckedCreateInput {
    return {
      id: session.id,
      accountId: session.accountId,
      createdAt: session.createdAt,
      lastRefreshedAt: session.lastRefreshedAt,
      idleExpiresAt: session.idleExpiresAt,
      absoluteExpiresAt: session.absoluteExpiresAt,
      revokedAt: session.revokedAt,
      revokedReason: session.revokedReason,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
    };
  }

  static toSessionUpdate(session: AuthSession): Prisma.AuthSessionUncheckedUpdateInput {
    return {
      lastRefreshedAt: session.lastRefreshedAt,
      idleExpiresAt: session.idleExpiresAt,
      revokedAt: session.revokedAt,
      revokedReason: session.revokedReason,
    };
  }

  static toRefreshTokenCreate(token: RefreshToken): Prisma.AuthRefreshTokenUncheckedCreateInput {
    return {
      id: token.id,
      sessionId: token.sessionId,
      tokenDigest: token.digest,
      createdAt: token.createdAt,
      consumedAt: token.consumedAt,
    };
  }
}
