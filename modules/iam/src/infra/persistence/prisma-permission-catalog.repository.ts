import { Injectable } from '@nestjs/common';
import { DatabaseWriteClient, type Prisma } from '@repo/database';
import type { PermissionCatalogRepository } from '../../app';
import {
  isEmptyPlan,
  PERMISSIONS,
  permissionModule,
  type CatalogSyncPlan,
  type StoredCatalog,
} from '../../domain';

// One key for every instance: pg_advisory_xact_lock queues concurrent syncs until commit.
const SYNC_LOCK = 'iam:permission-catalog';
const TRANSACTION_TIMEOUT_MS = 15_000;

@Injectable()
export class PrismaPermissionCatalogRepository implements PermissionCatalogRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async sync(decide: (stored: StoredCatalog) => CatalogSyncPlan): Promise<CatalogSyncPlan> {
    return this.db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${SYNC_LOCK}))`;

        const [permissions, roles] = await Promise.all([
          tx.permission.findMany(),
          tx.role.findMany({ select: { key: true } }),
        ]);
        const plan = decide({
          permissions: permissions.map((permission) => ({
            key: permission.key,
            module: permission.module,
            description: permission.description,
            deprecated: permission.deprecatedAt !== null,
          })),
          roleKeys: roles.map((role) => role.key),
        });
        if (!isEmptyPlan(plan)) await apply(tx, plan);
        return plan;
      },
      { timeout: TRANSACTION_TIMEOUT_MS },
    );
  }
}

// Permissions first: grants reference them.
async function apply(tx: Prisma.TransactionClient, plan: CatalogSyncPlan): Promise<void> {
  if (plan.add.length > 0) {
    await tx.permission.createMany({
      data: plan.add.map((key) => ({
        key,
        module: permissionModule(key),
        description: PERMISSIONS[key],
      })),
    });
  }
  if (plan.restore.length > 0) {
    await tx.permission.updateMany({
      where: { key: { in: plan.restore } },
      data: { deprecatedAt: null },
    });
  }
  if (plan.deprecate.length > 0) {
    await tx.permission.updateMany({
      where: { key: { in: plan.deprecate } },
      data: { deprecatedAt: new Date() },
    });
  }
  for (const key of plan.describe) {
    await tx.permission.update({
      where: { key },
      data: { module: permissionModule(key), description: PERMISSIONS[key] },
    });
  }

  const roles = await tx.role.findMany({
    where: { key: { in: [...new Set(plan.grants.flatMap((grant) => grant.roles))] } },
    select: { id: true, key: true },
  });
  const roleIds = new Map(roles.map((role) => [role.key, role.id]));
  const grants = plan.grants.flatMap((grant) =>
    grant.roles.map((key) => ({ roleId: roleIds.get(key)!, permissionKey: grant.permission })),
  );
  if (grants.length > 0) await tx.rolePermission.createMany({ data: grants, skipDuplicates: true });
}
