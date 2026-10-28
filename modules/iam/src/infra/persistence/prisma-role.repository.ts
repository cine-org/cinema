import { Injectable } from '@nestjs/common';
import {
  DatabaseWriteClient,
  PRISMA_ERROR_CODE,
  throwIfPrismaError,
  type Prisma,
} from '@repo/database';
import type { RoleRepository } from '../../app';
import { Role, RoleKeyTakenException } from '../../domain';

const ACTIVE_PERMISSIONS = {
  where: { permission: { deprecatedAt: null } },
  select: { permissionKey: true },
} satisfies Prisma.Role$permissionsArgs;

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findCatalog(): Promise<Set<string>> {
    return catalogOf(this.db);
  }

  async create(role: Role): Promise<void> {
    try {
      await this.db.role.create({
        data: {
          id: role.id,
          key: role.key,
          name: role.name,
          scopes: [...role.scopes],
          isSystem: role.isSystem,
          isLocked: role.isLocked,
          permissions: {
            createMany: { data: role.permissions.map((permissionKey) => ({ permissionKey })) },
          },
        },
      });
    } catch (error) {
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED]: () =>
          new RoleKeyTakenException({ cause: error }),
      });
      throw error;
    }
  }

  async modify<T>(
    roleId: string,
    change: (role: Role, catalog: ReadonlySet<string>) => T,
  ): Promise<T | null> {
    return this.db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM roles WHERE id = ${roleId} FOR UPDATE`;
      if (locked.length === 0) return null;

      const [row, catalog] = await Promise.all([
        tx.role.findUniqueOrThrow({
          where: { id: roleId },
          include: { permissions: ACTIVE_PERMISSIONS },
        }),
        catalogOf(tx),
      ]);
      const role = Role.restore({
        id: row.id,
        key: row.key,
        name: row.name,
        scopes: row.scopes,
        isSystem: row.isSystem,
        isLocked: row.isLocked,
        permissions: new Set(row.permissions.map((grant) => grant.permissionKey)),
      });

      const before = new Set(role.permissions);
      const result = change(role, catalog);
      const after = new Set(role.permissions);

      // Only active permissions were loaded: rows of deprecated ones stay as they are.
      const removed = [...before].filter((key) => !after.has(key));
      const added = [...after].filter((key) => !before.has(key));
      if (removed.length > 0) {
        await tx.rolePermission.deleteMany({
          where: { roleId, permissionKey: { in: removed } },
        });
      }
      if (added.length > 0) {
        await tx.rolePermission.createMany({
          data: added.map((permissionKey) => ({ roleId, permissionKey })),
        });
      }
      return result;
    });
  }
}

async function catalogOf(db: Prisma.TransactionClient): Promise<Set<string>> {
  const permissions = await db.permission.findMany({
    where: { deprecatedAt: null },
    select: { key: true },
  });
  return new Set(permissions.map((permission) => permission.key));
}
