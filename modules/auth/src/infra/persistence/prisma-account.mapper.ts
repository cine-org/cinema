import { Email } from '@repo/common';
import type { Prisma } from '@repo/database';
import { Account, EmailCode, type AccountCodes } from '../../domain';

export class PrismaAccountMapper {
  static toAccount(
    user: Prisma.UserModel & { email: string },
    codes: {
      verification: Prisma.AuthChallengeModel | null;
      passwordReset: Prisma.AuthChallengeModel | null;
      invitation: Prisma.AuthChallengeModel | null;
    },
  ): Account {
    const restored: AccountCodes = {
      verification: codes.verification ? PrismaAccountMapper.toCode(codes.verification) : null,
      passwordReset: codes.passwordReset ? PrismaAccountMapper.toCode(codes.passwordReset) : null,
      invitation: codes.invitation ? PrismaAccountMapper.toCode(codes.invitation) : null,
    };
    return Account.restore(
      {
        id: user.id,
        email: Email.create(user.email),
        passwordHash: user.passwordHash,
        fullName: user.fullName,
        isEmailVerified: user.isEmailVerified,
      },
      restored,
    );
  }

  static toCode(row: Prisma.AuthChallengeModel): EmailCode {
    return EmailCode.restore({
      id: row.id,
      accountId: row.accountId,
      purpose: row.purpose,
      secretDigest: row.secretDigest,
      failedAttempts: row.failedAttempts,
      expiresAt: row.expiresAt,
      consumedAt: row.consumedAt,
      revokedAt: row.revokedAt,
      createdAt: row.createdAt,
    });
  }

  static toUserCreate(account: Account): Prisma.UserUncheckedCreateInput {
    return {
      id: account.id,
      email: account.email.value,
      passwordHash: account.passwordHash,
      fullName: account.fullName,
      isEmailVerified: account.isEmailVerified,
    };
  }

  static toUserUpdate(account: Account): Prisma.UserUncheckedUpdateInput {
    return {
      passwordHash: account.passwordHash,
      fullName: account.fullName,
      isEmailVerified: account.isEmailVerified,
    };
  }

  static toCodeCreate(code: EmailCode, createdAt: Date): Prisma.AuthChallengeUncheckedCreateInput {
    return {
      id: code.id,
      accountId: code.accountId,
      purpose: code.purpose,
      secretDigest: code.secretDigest,
      failedAttempts: code.failedAttempts,
      expiresAt: code.expiresAt,
      consumedAt: code.consumedAt,
      revokedAt: code.revokedAt,
      createdAt,
    };
  }

  static toCodeUpdate(code: EmailCode): Prisma.AuthChallengeUncheckedUpdateInput {
    return {
      failedAttempts: code.failedAttempts,
      consumedAt: code.consumedAt,
      revokedAt: code.revokedAt,
    };
  }
}
