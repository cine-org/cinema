import type { Prisma } from '@repo/database';
import type { Account } from '../../domain';

export class PrismaAccountMapper {
  static toCreateInput(account: Account): Prisma.UserCreateInput {
    return {
      id: account.id,
      email: account.email,
      isEmailVerified: account.isEmailVerified,
      passwordHash: account.passwordHash,
      fullName: account.fullName,
    };
  }
}
