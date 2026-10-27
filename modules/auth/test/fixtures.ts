import { Email } from '@repo/common';
import {
  Account,
  AuthSession,
  EmailCode,
  RefreshToken,
  type AuthSessionProps,
  type EmailCodePurpose,
} from '../src/domain';

export const NOW = new Date('2026-10-12T08:00:00.000Z');

export const at = (base: Date, seconds: number) => new Date(base.getTime() + seconds * 1000);

export const ACCOUNT_ID = '00000000-0000-4000-8000-000000000001';

export function code(
  purpose: EmailCodePurpose,
  overrides: { id?: string; accountId?: string; now?: Date } = {},
): EmailCode {
  return EmailCode.issue({
    id: overrides.id ?? crypto.randomUUID(),
    accountId: overrides.accountId ?? ACCOUNT_ID,
    purpose,
    secretDigest: 'digest',
    now: overrides.now ?? NOW,
  });
}

export function accountWith(
  overrides: {
    isEmailVerified?: boolean;
    passwordHash?: string;
    verification?: EmailCode | null;
    passwordReset?: EmailCode | null;
    invitation?: EmailCode | null;
  } = {},
): Account {
  return Account.restore(
    {
      id: ACCOUNT_ID,
      email: Email.create('user@cinema.local'),
      passwordHash: overrides.passwordHash ?? 'hash-1',
      fullName: 'User',
      isEmailVerified: overrides.isEmailVerified ?? true,
    },
    {
      verification: overrides.verification ?? null,
      passwordReset: overrides.passwordReset ?? null,
      invitation: overrides.invitation ?? null,
    },
  );
}

export function refreshToken(sessionId: string, now = NOW): RefreshToken {
  return RefreshToken.issue({
    id: crypto.randomUUID(),
    sessionId,
    digest: crypto.randomUUID(),
    now,
  });
}

export function startedSession(now = NOW): AuthSession {
  const id = AuthSession.newId();
  return AuthSession.start({
    id,
    accountId: ACCOUNT_ID,
    surface: 'USER',
    refreshToken: refreshToken(id, now),
    now,
    userAgent: 'test',
    ipAddress: null,
  });
}

export function sessionWith(overrides: Partial<AuthSessionProps> = {}): AuthSession {
  return AuthSession.restore({
    id: crypto.randomUUID(),
    accountId: ACCOUNT_ID,
    surface: 'USER',
    createdAt: NOW,
    lastRefreshedAt: NOW,
    idleExpiresAt: at(NOW, 30 * 24 * 3600),
    absoluteExpiresAt: at(NOW, 90 * 24 * 3600),
    revokedAt: null,
    revokedReason: null,
    userAgent: null,
    ipAddress: null,
    ...overrides,
  });
}
