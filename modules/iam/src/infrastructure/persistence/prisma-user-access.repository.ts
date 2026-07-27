import { Injectable } from '@nestjs/common';
import { DatabaseClient } from '@repo/database';
import type { Permission, Role } from '../../domain';
import type { UserAccessRepository } from '../../application';
import { PrismaPermissionMapper } from './prisma-permission.mapper';
import { PrismaRoleMapper } from './prisma-role.mapper';

@Injectable()
export class PrismaUserAccessRepository implements UserAccessRepository {
  constructor(private readonly db: DatabaseClient) {}

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    await this.db.userRole.createMany({
      data: [{ userId, roleId }],
      skipDuplicates: true,
    });
  }

  async revokeRoleFromUser(userId: string, roleId: string): Promise<void> {
    await this.db.userRole.deleteMany({ where: { userId, roleId } });
  }

  async grantPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    await this.db.rolePermission.createMany({
      data: [{ roleId, permissionId }],
      skipDuplicates: true,
    });
  }

  async revokePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    await this.db.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const userRoles = await this.db.userRole.findMany({
      where: { userId },
      include: { role: true },
      orderBy: { createdAt: 'asc' },
    });

    return userRoles.map((userRole) => PrismaRoleMapper.toDomain(userRole.role));
  }

  async getUserPermissions(userId: string): Promise<Permission[]> {
    const rolePermissions = await this.db.rolePermission.findMany({
      where: {
        role: {
          users: {
            some: { userId },
          },
        },
      },
      include: { permission: true },
      orderBy: { permission: { code: 'asc' } },
    });

    const uniquePermissions = new Map<string, Permission>();

    for (const rolePermission of rolePermissions) {
      const permission = PrismaPermissionMapper.toDomain(rolePermission.permission);
      uniquePermissions.set(permission.code.value, permission);
    }

    return [...uniquePermissions.values()];
  }

  async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
    const rolePermission = await this.db.rolePermission.findFirst({
      where: {
        permission: { code: permissionCode },
        role: {
          users: {
            some: { userId },
          },
        },
      },
      select: { id: true },
    });

    return rolePermission !== null;
  }
}
