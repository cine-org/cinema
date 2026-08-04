import type { User as PrismaUser } from '@repo/database';
import { User, UserStatus } from '../../domain';

export class PrismaUserMapper {
  static toDomain(user: PrismaUser): User {
    return User.restore({
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      dateOfBirth: user.dateOfBirth,
      status: UserStatus.create(user.status),
      statusChangedAt: user.statusChangedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}
