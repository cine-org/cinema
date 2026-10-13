import { Injectable } from '@nestjs/common';
import { DatabaseReadClient } from '@repo/database';
import type { ActiveSessionView, AuthSessionReadRepository } from '../../app';

@Injectable()
export class PrismaAuthSessionReadRepository implements AuthSessionReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async listActive(accountId: string, now: Date): Promise<ActiveSessionView[]> {
    return this.db.authSession.findMany({
      where: {
        accountId,
        revokedAt: null,
        idleExpiresAt: { gt: now },
        absoluteExpiresAt: { gt: now },
      },
      orderBy: [{ lastRefreshedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        createdAt: true,
        lastRefreshedAt: true,
        userAgent: true,
        ipAddress: true,
      },
    });
  }
}
