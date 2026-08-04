import { Injectable } from '@nestjs/common';
import { DatabaseClient, Prisma, UserStatus as PrismaUserStatus } from '@repo/database';
import { USER_STATUS, UserNotFoundException, type User, type UserStatusValue } from '../../domain';
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
    const limit = Math.max(filter.limit ?? DEFAULT_LIMIT, 1);
    const status = filter.status ?? DEFAULT_STATUS;

    const where: Prisma.UserWhereInput = {
      ...(status === 'all' ? {} : { status }),
      ...(filter.search
        ? {
            fullName: {
              contains: filter.search,
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

  async activate(userId: string): Promise<void> {
    await this.updateStatus(userId, PrismaUserStatus.ACTIVE);
  }

  async deactivate(userId: string): Promise<void> {
    await this.updateStatus(userId, PrismaUserStatus.DEACTIVATED);
  }

  async suspend(userId: string): Promise<void> {
    await this.updateStatus(userId, PrismaUserStatus.SUSPENDED);
  }

  private async updateStatus(userId: string, status: UserStatusValue): Promise<void> {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: { status: true },
    });

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.status === status) {
      return;
    }

    await this.db.user.update({
      where: { id: userId },
      data: {
        status,
        statusChangedAt: new Date(),
      },
    });
  }
}
