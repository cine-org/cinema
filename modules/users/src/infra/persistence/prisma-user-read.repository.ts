import { Injectable } from '@nestjs/common';
import { DatabaseReadClient, Prisma } from '@repo/database';
import type { UserReadRepository, UserView } from '../../app';

// Columns exposed to readers; never passwordHash.
const USER_VIEW_SELECT = {
  id: true,
  email: true,
  isEmailVerified: true,
  fullName: true,
  dateOfBirth: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class PrismaUserReadRepository implements UserReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async findById(id: string): Promise<UserView | null> {
    return this.db.user.findFirst({
      where: { id, deletedAt: null },
      select: USER_VIEW_SELECT,
    });
  }
}
