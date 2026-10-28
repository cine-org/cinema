import { Injectable } from '@nestjs/common';
import { DatabaseWriteClient } from '@repo/database';
import type { GrantableRole, RoleAssignmentRepository, RoleChange } from '../../app';
import { SYSTEM_ROLE, type CurrentRole } from '../../domain';

// Queues every change that could remove a SUPER_ADMIN, so two of them cannot each see the other
// as the one that stays.
const ADMINS_LOCK = 'iam:admins';

@Injectable()
export class PrismaRoleAssignmentRepository implements RoleAssignmentRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findRoleByKey(key: string): Promise<GrantableRole | null> {
    return this.db.role.findUnique({
      where: { key },
      select: { id: true, key: true, scopes: true },
    });
  }

  async clusterExists(clusterId: string): Promise<boolean> {
    return (await this.db.cluster.count({ where: { id: clusterId } })) > 0;
  }

  async isOpenTheater(theaterId: string): Promise<boolean> {
    const theater = await this.db.theater.findUnique({
      where: { id: theaterId },
      select: { status: true },
    });
    return theater !== null && theater.status !== 'CLOSED';
  }

  async changeRole(change: RoleChange, check: (current: CurrentRole) => void): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE id = ${change.accountId} AND deleted_at IS NULL FOR UPDATE`;
      if (locked.length === 0) return false;

      const active = await tx.roleAssignment.findFirst({
        where: { userId: change.accountId, revokedAt: null },
        select: { id: true, role: { select: { key: true } } },
      });
      if (!active) return false;

      let otherAdmins: number | null = null;
      if (active.role.key === SYSTEM_ROLE.SUPER_ADMIN) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ADMINS_LOCK}))`;
        otherAdmins = await tx.roleAssignment.count({
          where: {
            revokedAt: null,
            role: { key: SYSTEM_ROLE.SUPER_ADMIN },
            userId: { not: change.accountId },
            user: { deletedAt: null },
          },
        });
      }
      check({ roleKey: active.role.key, otherAdmins });

      // Revoked first: the database allows one active assignment per account.
      await tx.roleAssignment.update({
        where: { id: active.id },
        data: { revokedAt: new Date(), revokedById: change.actorId },
      });
      await tx.roleAssignment.create({
        data: {
          userId: change.accountId,
          roleId: change.role.id,
          scope: change.scope,
          clusterId: change.clusterId,
          theaterId: change.theaterId,
          grantedById: change.actorId,
        },
      });
      return true;
    });
  }
}
