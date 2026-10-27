import { Injectable } from '@nestjs/common';
import {
  DatabaseWriteClient,
  PRISMA_ERROR_CODE,
  throwIfPrismaError,
  type Prisma,
} from '@repo/database';
import type { RoleRepository, RoleView } from '../../app';
import { Role, RoleKeyTakenException, SYSTEM_ROLE_KEYS } from '../../domain';

const ROLE_VIEW_SELECT = {
  id: true,
  key: true,
  name: true,
  scopes: true,
  isSystem: true,
  isLocked: true,
  permissions: {
    where: { permission: { deprecatedAt: null } },
    select: { permissionKey: true },
    orderBy: { permissionKey: 'asc' },
  },
  _count: { select: { assignments: { where: { revokedAt: null } } } },
} satisfies Prisma.RoleSelect;

type RoleRow = Prisma.RoleGetPayload<{ select: typeof ROLE_VIEW_SELECT }>;

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async listPermissions(): Promise<string[]> {
    const rows = await this.db.permission.findMany({
      where: { deprecatedAt: null },
      select: { key: true },
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });
    return rows.map((row) => row.key);
  }

  // System roles first, in their fixed order; custom roles by name.
  async listRoles(): Promise<RoleView[]> {
    const rows = await this.db.role.findMany({ select: ROLE_VIEW_SELECT });
    const rank = (role: RoleView) => {
      const index = (SYSTEM_ROLE_KEYS as readonly string[]).indexOf(role.key);
      return index === -1 ? SYSTEM_ROLE_KEYS.length : index;
    };
    return rows.map(toView).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  }

  async findRole(id: string): Promise<RoleView | null> {
    const row = await this.db.role.findUnique({ where: { id }, select: ROLE_VIEW_SELECT });
    return row ? toView(row) : null;
  }

  async create(role: Role): Promise<void> {
    try {
      await this.db.role.create({
        data: {
          id: role.id,
          key: role.key,
          name: role.name,
          scopes: [...role.scopes],
          permissions: { create: role.permissions.map((permissionKey) => ({ permissionKey })) },
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
    change: (role: Role, active: ReadonlySet<string>) => T,
  ): Promise<T | null> {
    return this.db.$transaction(async (tx) => {
      // Two admins editing one role apply one after the other.
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM roles WHERE id = ${roleId} FOR UPDATE`;
      if (locked.length === 0) return null;

      const [row, active] = await Promise.all([
        tx.role.findUniqueOrThrow({
          where: { id: roleId },
          include: { permissions: { select: { permissionKey: true } } },
        }),
        tx.permission.findMany({ where: { deprecatedAt: null }, select: { key: true } }),
      ]);
      const role = Role.restore({
        ...row,
        permissions: new Set(row.permissions.map((p) => p.permissionKey)),
      });

      const result = change(role, new Set(active.map((p) => p.key)));

      const { added, removed } = role.permissionChange ?? { added: [], removed: [] };
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

function toView(row: RoleRow): RoleView {
  const { permissions, _count, ...role } = row;
  return {
    ...role,
    permissions: permissions.map((p) => p.permissionKey),
    users: _count.assignments,
  };
}
