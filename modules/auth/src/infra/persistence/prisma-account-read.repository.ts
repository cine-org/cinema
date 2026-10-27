import { Injectable } from '@nestjs/common';
import { DatabaseReadClient } from '@repo/database';
import type { AccountProfile, AccountReadRepository } from '../../app';

@Injectable()
export class PrismaAccountReadRepository implements AccountReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async existsByEmail(email: string): Promise<boolean> {
    const found = await this.db.user.findFirst({ where: { email }, select: { id: true } });
    return found !== null;
  }

  async findProfile(accountId: string): Promise<AccountProfile | null> {
    const row = await this.db.user.findFirst({
      where: { id: accountId, deletedAt: null },
      select: {
        email: true,
        fullName: true,
        roleAssignments: {
          where: { revokedAt: null },
          take: 1,
          select: { role: { select: { name: true } } },
        },
      },
    });
    if (!row) return null;
    return {
      email: row.email,
      fullName: row.fullName,
      roleName: row.roleAssignments[0]?.role.name ?? null,
    };
  }
}
