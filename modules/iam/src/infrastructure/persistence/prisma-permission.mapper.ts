import type { Permission as PrismaPermission } from '@repo/database';
import { Permission, PermissionCode } from '../../domain';

export class PrismaPermissionMapper {
  static toDomain(permission: PrismaPermission): Permission {
    return Permission.restore({
      id: permission.id,
      code: PermissionCode.create(permission.code),
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    });
  }
}
