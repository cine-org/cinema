import { Injectable } from '@nestjs/common';
import { DatabaseReadClient, type Prisma } from '@repo/database';
import type { IamReadRepository, RoleView } from '../../app';
import { SYSTEM_ROLE } from '../../domain';

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
  _count: { select: { assignments: { where: { revokedAt: null, user: { deletedAt: null } } } } },
} satisfies Prisma.RoleSelect;

const INTERNAL_ROLE = { key: { not: SYSTEM_ROLE.CUSTOMER } } satisfies Prisma.RoleWhereInput;

@Injectable()
export class PrismaIamReadRepository implements IamReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async listPermissions(): Promise<string[]> {
    const permissions = await this.db.permission.findMany({
      where: { deprecatedAt: null },
      select: { key: true },
      orderBy: { key: 'asc' },
    });
    return permissions.map((permission) => permission.key);
  }

  async listRoles(): Promise<RoleView[]> {
    const roles = await this.db.role.findMany({
      where: INTERNAL_ROLE,
      select: ROLE_VIEW_SELECT,
      orderBy: [{ isSystem: 'desc' }, { createdAt: 'asc' }, { key: 'asc' }],
    });
    return roles.map(toRoleView);
  }

  async findRole(roleId: string): Promise<RoleView | null> {
    const role = await this.db.role.findFirst({
      where: { id: roleId, ...INTERNAL_ROLE },
      select: ROLE_VIEW_SELECT,
    });
    return role ? toRoleView(role) : null;
  }
}

function toRoleView({
  permissions,
  _count,
  ...role
}: Prisma.RoleGetPayload<{ select: typeof ROLE_VIEW_SELECT }>): RoleView {
  return {
    ...role,
    permissions: permissions.map((grant) => grant.permissionKey),
    users: _count.assignments,
  };
}
