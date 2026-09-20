import { Injectable } from '@nestjs/common';
import { DatabaseClient } from '@repo/database';
import type { Role } from '../../domain';
import type { RoleListFilter, RoleRepository } from '../../application';
import { PrismaRoleMapper } from './prisma-role.mapper';

@Injectable()
export class PrismaRoleRepository implements RoleRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<Role | null> {
    const role = await this.db.role.findUnique({ where: { id } });
    return role ? PrismaRoleMapper.toDomain(role) : null;
  }

  async findByCode(code: string): Promise<Role | null> {
    const role = await this.db.role.findUnique({ where: { code } });
    return role ? PrismaRoleMapper.toDomain(role) : null;
  }

  async list(filter: RoleListFilter = {}): Promise<Role[]> {
    const roles = await this.db.role.findMany({
      where: {
        ...(filter.type ? { type: filter.type } : {}),
        ...(filter.search
          ? {
              OR: [
                { code: { contains: filter.search } },
                { name: { contains: filter.search } },
                { description: { contains: filter.search } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return roles.map(PrismaRoleMapper.toDomain);
  }

  async save(role: Role): Promise<void> {
    await this.db.role.create({
      data: {
        id: role.id,
        code: role.code.value,
        name: role.name,
        description: role.description,
        type: role.type.value,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    });
  }

  async update(role: Role): Promise<void> {
    await this.db.role.update({
      where: { id: role.id },
      data: {
        name: role.name,
        description: role.description,
        updatedAt: role.updatedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.db.role.delete({ where: { id } });
  }
}
