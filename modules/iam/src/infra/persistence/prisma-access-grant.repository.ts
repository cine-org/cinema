import { Injectable } from '@nestjs/common';
import { DatabaseWriteClient } from '@repo/database';
import type { AccessGrantRepository } from '../../app';
import type { AccessGrant } from '../../domain';

// Reads the primary: a replica lagging behind would let a revoked role through for a while.
@Injectable()
export class PrismaAccessGrantRepository implements AccessGrantRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findActive(accountId: string): Promise<AccessGrant | null> {
    // At most one active assignment per account (partial unique index).
    const assignment = await this.db.roleAssignment.findFirst({
      where: { userId: accountId, revokedAt: null, user: { deletedAt: null } },
      select: {
        scope: true,
        clusterId: true,
        theaterId: true,
        role: {
          select: {
            key: true,
            // Deprecated permissions are no longer checked by code.
            permissions: {
              where: { permission: { deprecatedAt: null } },
              select: { permissionKey: true },
            },
          },
        },
      },
    });
    if (!assignment) return null;

    const { role, ...place } = assignment;
    return {
      ...place,
      roleKey: role.key,
      permissions: new Set(role.permissions.map((grant) => grant.permissionKey)),
    };
  }
}
