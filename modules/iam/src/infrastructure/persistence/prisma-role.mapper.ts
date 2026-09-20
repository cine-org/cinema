import type { Role as PrismaRole } from '@repo/database';
import { Role, RoleCode, RoleType } from '../../domain';

export class PrismaRoleMapper {
  static toDomain(role: PrismaRole): Role {
    return Role.restore({
      id: role.id,
      code: RoleCode.create(role.code),
      name: role.name,
      description: role.description,
      type: RoleType.create(role.type),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    });
  }
}
