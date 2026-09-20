import { Injectable } from '@nestjs/common';
import { DatabaseClient, Prisma } from '@repo/database';
import { USER_STATUS, type User } from '../../domain';
import type { UserRepository, UsersPage, UsersPageFilter } from '../../application';
import { PrismaUserMapper } from './prisma-user.mapper';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const DEFAULT_STATUS = USER_STATUS.ACTIVE;

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.db.user.findUnique({ where: { id } });
    return user ? PrismaUserMapper.toDomain(user) : null;
  }

  async paginate(filter: UsersPageFilter = {}): Promise<UsersPage> {
    const page = Math.max(filter.page ?? DEFAULT_PAGE, 1);
    const limit = Math.min(Math.max(filter.limit ?? DEFAULT_LIMIT, 1), 100);
    const status = filter.status ?? DEFAULT_STATUS;

    const where: Prisma.UserWhereInput = {
      ...(status === 'all' ? {} : { status }),
      ...(filter.search
        ? {
            fullName: {
              contains: filter.search,
              mode: 'insensitive',
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.db.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.user.count({ where }),
    ]);

    return {
      items: items.map(PrismaUserMapper.toDomain),
      total,
      page,
      limit,
    };
  }

  async updateProfile(user: User): Promise<void> {
    await this.db.user.update({
      where: { id: user.id },
      data: {
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        dateOfBirth: user.dateOfBirth,
      },
    });
  }

  async updateStatus(user: User): Promise<void> {
    await this.db.user.update({
      where: { id: user.id },
      data: {
        status: user.status.value,
        statusChangedAt: user.statusChangedAt,
      },
    });
  }
}
