import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '@repo/common';
import { DatabaseWriteClient, type Prisma } from '@repo/database';
import type { EmployeeView, RoleAssignmentRepository, RoleChange, RoleSummary } from '../../app';
import {
  AccountNotFoundException,
  CustomerAccountException,
  LastAdminException,
  ROLE_SCOPE,
  SYSTEM_ROLE,
  type TheaterScope,
} from '../../domain';

// One key for every change away from SUPER_ADMIN: two admins cannot demote each other at once.
const ADMINS_LOCK = 'iam:admins';

@Injectable()
export class PrismaRoleAssignmentRepository implements RoleAssignmentRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findRoleByKey(key: string): Promise<RoleSummary | null> {
    return this.db.role.findUnique({ where: { key }, select: { key: true, scopes: true } });
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

  async changeRole({ userId, roleKey, place, actorId }: RoleChange): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ deleted_at: Date | null }[]>`
        SELECT deleted_at FROM users WHERE id = ${userId} FOR UPDATE`;
      if (locked.length === 0 || locked[0]!.deleted_at !== null) {
        throw new AccountNotFoundException();
      }

      const active = await tx.roleAssignment.findFirst({
        where: { userId, revokedAt: null },
        select: { id: true, role: { select: { key: true } } },
      });
      if (active?.role.key === SYSTEM_ROLE.CUSTOMER) throw new CustomerAccountException();

      if (active?.role.key === SYSTEM_ROLE.SUPER_ADMIN && roleKey !== SYSTEM_ROLE.SUPER_ADMIN) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ADMINS_LOCK}))`;
        const others = await tx.roleAssignment.count({
          where: {
            revokedAt: null,
            userId: { not: userId },
            role: { key: SYSTEM_ROLE.SUPER_ADMIN },
            user: { deletedAt: null },
          },
        });
        if (others === 0) throw new LastAdminException();
      }

      if (active) {
        await tx.roleAssignment.update({
          where: { id: active.id },
          data: { revokedAt: new Date(), revokedById: actorId },
        });
      }
      await tx.roleAssignment.create({
        data: {
          userId,
          roleId: (await tx.role.findUniqueOrThrow({ where: { key: roleKey } })).id,
          scope: place.scope,
          clusterId: place.clusterId,
          theaterId: place.theaterId,
          grantedById: actorId,
        },
      });
    });
  }

  async listEmployees(scope: TheaterScope, page: PageRequest): Promise<Page<EmployeeView>> {
    const where: Prisma.RoleAssignmentWhereInput = {
      revokedAt: null,
      scope: { not: ROLE_SCOPE.SELF },
      ...(scope.all
        ? {}
        : {
            OR: [
              { clusterId: { in: [...scope.clusterIds] } },
              { theaterId: { in: [...scope.theaterIds] } },
              { theater: { clusterId: { in: [...scope.clusterIds] } } },
            ],
          }),
    };
    const [rows, total] = await this.db.$transaction([
      this.db.roleAssignment.findMany({
        where,
        orderBy: [{ user: { createdAt: 'desc' } }, { id: 'desc' }],
        skip: (page.page - 1) * page.limit,
        take: page.limit,
        select: {
          scope: true,
          clusterId: true,
          theaterId: true,
          role: { select: { key: true, name: true } },
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              isEmailVerified: true,
              createdAt: true,
              deletedAt: true,
            },
          },
        },
      }),
      this.db.roleAssignment.count({ where }),
    ]);
    return {
      ...page,
      total,
      items: rows.map(({ user, ...grant }) => ({ ...user, ...grant })),
    };
  }
}
