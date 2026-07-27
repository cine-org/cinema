import { Injectable } from '@nestjs/common';
import { DatabaseClient } from '@repo/database';
import type { Permission } from '../../domain';
import type { PermissionListFilter, PermissionRepository } from '../../application';
import { PrismaPermissionMapper } from './prisma-permission.mapper';

@Injectable()
export class PrismaPermissionRepository implements PermissionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<Permission | null> {
    const permission = await this.db.permission.findUnique({ where: { id } });
    return permission ? PrismaPermissionMapper.toDomain(permission) : null;
  }

  async findByCode(code: string): Promise<Permission | null> {
    const permission = await this.db.permission.findUnique({ where: { code } });
    return permission ? PrismaPermissionMapper.toDomain(permission) : null;
  }

  async list(filter: PermissionListFilter = {}): Promise<Permission[]> {
    const permissions = await this.db.permission.findMany({
      where: filter.search
        ? {
            OR: [
              { code: { contains: filter.search } },
              { description: { contains: filter.search } },
            ],
          }
        : undefined,
      orderBy: { code: 'asc' },
    });

    return permissions.map(PrismaPermissionMapper.toDomain);
  }

  async save(permission: Permission): Promise<void> {
    await this.db.permission.create({
      data: {
        id: permission.id,
        code: permission.code.value,
        description: permission.description,
        createdAt: permission.createdAt,
        updatedAt: permission.updatedAt,
      },
    });
  }

  async update(permission: Permission): Promise<void> {
    await this.db.permission.update({
      where: { id: permission.id },
      data: {
        description: permission.description,
        updatedAt: permission.updatedAt,
      },
    });
  }
}
