import { Injectable } from '@nestjs/common';
import { Email, TooManyRequestsException } from '@repo/common';
import { DatabaseWriteClient, PRISMA_ERROR_CODE, Prisma, throwIfPrismaError } from '@repo/database';
import type {
  AccountWriteRepository,
  LoginCredentials,
  PasswordCheck,
  RegistrationAccount,
  VerificationOwner,
} from '../../app';
import {
  EMAIL_CODE_PURPOSE,
  type Account,
  type EmailCode,
  type EmailCodePurpose,
} from '../../domain';
import { PrismaAccountMapper } from './prisma-account.mapper';
import { transactionWithLockTimeout } from './transaction-with-lock-timeout';

function latestCode(purpose: EmailCodePurpose) {
  return {
    where: { purpose },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: 1,
  } satisfies Prisma.User$authChallengesArgs;
}

const LATEST_VERIFICATION = latestCode(EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION);

@Injectable()
export class PrismaAccountWriteRepository implements AccountWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findRegistrationByEmail(email: Email): Promise<RegistrationAccount | null> {
    return this.db.user.findUnique({
      where: { email: email.value },
      select: { id: true, isEmailVerified: true, deletedAt: true },
    });
  }

  async findLoginCredentials(email: Email): Promise<LoginCredentials | null> {
    return this.db.user.findFirst({
      where: { email: email.value, deletedAt: null },
      select: { id: true, passwordHash: true, isEmailVerified: true },
    });
  }

  async findOwnerOfPasswordReset(resetId: string): Promise<{ accountId: string } | null> {
    const row = await this.db.authChallenge.findUnique({
      where: { id: resetId },
      select: { purpose: true, account: { select: { id: true, deletedAt: true } } },
    });
    if (!row || row.purpose !== EMAIL_CODE_PURPOSE.PASSWORD_RESET || row.account.deletedAt) {
      return null;
    }
    return { accountId: row.account.id };
  }

  async findPasswordCheck(accountId: string): Promise<PasswordCheck | null> {
    const row = await this.db.user.findFirst({
      where: { id: accountId, deletedAt: null },
      select: { email: true, passwordHash: true },
    });
    if (!row?.email) return null;
    return { email: Email.create(row.email), passwordHash: row.passwordHash };
  }

  async findOwnerOfVerification(verificationId: string): Promise<VerificationOwner | null> {
    const row = await this.db.authChallenge.findUnique({
      where: { id: verificationId },
      select: {
        purpose: true,
        account: {
          select: {
            id: true,
            email: true,
            deletedAt: true,
            isEmailVerified: true,
            authChallenges: { ...LATEST_VERIFICATION, select: { id: true } },
          },
        },
      },
    });
    if (!row || row.purpose !== EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION) return null;

    const { id, email, deletedAt, isEmailVerified, authChallenges } = row.account;
    if (!email || deletedAt) return null;
    return {
      accountId: id,
      email: Email.create(email),
      canResend: !isEmailVerified && authChallenges[0]?.id === verificationId,
    };
  }

  async create(account: Account): Promise<void> {
    const code = account.latestVerification;
    if (!code) throw new Error('A new account needs a verification code');

    try {
      await this.db.$transaction([
        this.db.user.create({ data: PrismaAccountMapper.toUserCreate(account) }),
        this.db.authChallenge.create({
          data: PrismaAccountMapper.toCodeCreate(code, code.createdAt),
        }),
      ]);
    } catch (error) {
      // Same email created by a parallel registration that got past the cooldown.
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED]: () =>
          new TooManyRequestsException({ retryAfterSeconds: 1, cause: error }),
      });
      throw error;
    }
  }

  async modify<T>(accountId: string, change: (account: Account) => T): Promise<T | null> {
    return transactionWithLockTimeout(this.db, async (tx) => {
      // NO KEY UPDATE: blocks other auth changes but not inserts that reference the user.
      const locked = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE id = ${accountId} AND deleted_at IS NULL FOR NO KEY UPDATE`;
      if (locked.length === 0) return null;

      const user = await tx.user.findUniqueOrThrow({ where: { id: accountId } });
      if (!user.email) return null;
      const [verification, passwordReset] = await Promise.all(
        [EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION, EMAIL_CODE_PURPOSE.PASSWORD_RESET].map((purpose) =>
          tx.authChallenge.findFirst({
            ...latestCode(purpose),
            where: { accountId, purpose },
          }),
        ),
      );

      const account = PrismaAccountMapper.toAccount(
        { ...user, email: user.email },
        { verification: verification ?? null, passwordReset: passwordReset ?? null },
      );
      const before = snapshot(account);
      const result = change(account);
      await save(tx, account, before);
      return result;
    });
  }
}

// A code as loaded, to write only what the change touched.
type CodeSnapshot = {
  readonly code: EmailCode | null;
  readonly failedAttempts: number | null;
  readonly consumedAt: Date | null;
  readonly revokedAt: Date | null;
};

type Snapshot = {
  readonly passwordHash: string;
  readonly fullName: string | null;
  readonly isEmailVerified: boolean;
  readonly verification: CodeSnapshot;
  readonly passwordReset: CodeSnapshot;
};

function snapshot(account: Account): Snapshot {
  return {
    passwordHash: account.passwordHash,
    fullName: account.fullName,
    isEmailVerified: account.isEmailVerified,
    verification: snapshotCode(account.latestVerification),
    passwordReset: snapshotCode(account.latestPasswordReset),
  };
}

function snapshotCode(code: EmailCode | null): CodeSnapshot {
  return {
    code,
    failedAttempts: code?.failedAttempts ?? null,
    consumedAt: code?.consumedAt ?? null,
    revokedAt: code?.revokedAt ?? null,
  };
}

// Replaced codes are revoked before new ones are inserted: the database allows one active code
// per account and purpose. Sessions end in the same transaction as the password change.
async function save(
  tx: Prisma.TransactionClient,
  account: Account,
  before: Snapshot,
): Promise<void> {
  const userChanged =
    account.passwordHash !== before.passwordHash ||
    account.fullName !== before.fullName ||
    account.isEmailVerified !== before.isEmailVerified;
  if (userChanged) {
    await tx.user.update({
      where: { id: account.id },
      data: PrismaAccountMapper.toUserUpdate(account),
    });
  }

  for (const replaced of account.replacedCodes) {
    await tx.authChallenge.update({
      where: { id: replaced.id },
      data: PrismaAccountMapper.toCodeUpdate(replaced),
    });
  }
  await saveCode(tx, account.latestVerification, before.verification);
  await saveCode(tx, account.latestPasswordReset, before.passwordReset);

  const revocation = account.sessionRevocation;
  if (revocation) {
    await tx.authSession.updateMany({
      where: { accountId: account.id, revokedAt: null },
      data: { revokedAt: revocation.at, revokedReason: revocation.reason },
    });
  }
}

async function saveCode(
  tx: Prisma.TransactionClient,
  latest: EmailCode | null,
  before: CodeSnapshot,
): Promise<void> {
  if (!latest) return;

  if (latest !== before.code) {
    // Strictly after the code it replaces, whatever the server clocks say, so it is the latest.
    const createdAt = before.code
      ? new Date(Math.max(Date.now(), before.code.createdAt.getTime() + 1))
      : new Date();
    await tx.authChallenge.create({ data: PrismaAccountMapper.toCodeCreate(latest, createdAt) });
    return;
  }

  const changed =
    latest.failedAttempts !== before.failedAttempts ||
    latest.consumedAt !== before.consumedAt ||
    latest.revokedAt !== before.revokedAt;
  if (changed) {
    await tx.authChallenge.update({
      where: { id: latest.id },
      data: PrismaAccountMapper.toCodeUpdate(latest),
    });
  }
}
