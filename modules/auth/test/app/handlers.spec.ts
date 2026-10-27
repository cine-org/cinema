import { Email } from '@repo/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AuthenticateHandler,
  AuthenticateQuery,
  ChangePasswordCommand,
  ChangePasswordHandler,
  ForgotPasswordCommand,
  ForgotPasswordHandler,
  LoginCommand,
  LoginHandler,
  RefreshCommand,
  RefreshHandler,
  ResetPasswordCommand,
  ResetPasswordHandler,
  type AccessTokenIssuer,
  type AccountWriteRepository,
  type AuthMailer,
  type AuthSessionWriteRepository,
  type EmailOtpProtector,
  type EmailVerificationLimiter,
  type LoginLimiter,
  type PasswordHasher,
  type RefreshTokenProtector,
  type LoginCredentials,
  type SessionGuardState,
  type SessionOwner,
} from '../../src/app';
import {
  AuthSession,
  EMAIL_CODE_PURPOSE,
  type Account,
  type AuthSessionSurface,
  type RefreshOutcome,
  type RefreshToken,
} from '../../src/domain';
import { ACCOUNT_ID, accountWith, at, code, refreshToken, sessionWith } from '../fixtures';

const EMAIL = 'user@cinema.local';
const allowed = { allowed: true } as const;
const limited = { allowed: false, retryAfterSeconds: 42 } as const;

// Runs the repository callback on `account`, as modify() does under its lock.
function accountsWith(account: Account | null) {
  return {
    findLoginCredentials: vi.fn(),
    findRegistrationByEmail: vi.fn(),
    findOwnerOfPasswordReset: vi.fn(),
    findPasswordCheck: vi.fn(),
    findOwnerOfVerification: vi.fn(),
    findInvitationTarget: vi.fn(),
    findOwnerOfInvitation: vi.fn(),
    findRole: vi.fn(),
    isOpenTheater: vi.fn(),
    clusterExists: vi.fn(),
    createFirstAdmin: vi.fn(),
    create: vi.fn(),
    modify: vi.fn(async (_id: string, change: (a: Account) => unknown) =>
      account ? change(account) : null,
    ),
  } satisfies Record<keyof AccountWriteRepository, unknown>;
}

function sessionsStub() {
  return {
    findGuardState: vi.fn(),
    start: vi.fn(
      async (
        _a: string,
        _h: string,
        _s: AuthSessionSurface,
        _n: Date,
        open: (active: AuthSession[]) => AuthSession,
      ): Promise<AuthSession | null> => open([]),
    ),
    modifyByTokenDigest: vi.fn(),
    revokeByTokenDigest: vi.fn(),
    revoke: vi.fn(),
    revokeAll: vi.fn(),
  } satisfies Record<keyof AuthSessionWriteRepository, unknown>;
}

const hasherStub = (verifies: boolean) => ({
  hash: vi.fn(async (password: string) => `hashed:${password}`),
  verify: vi.fn(async () => verifies),
});

const accessTokens = {
  issue: vi.fn(async () => ({ token: 'access', expiresAt: new Date() })),
  verify: vi.fn(),
} satisfies AccessTokenIssuer;

const refreshTokens = {
  issue: vi.fn(({ sessionId, now }: { sessionId: string; now: Date }) => ({
    token: 'refresh',
    refreshToken: refreshToken(sessionId, now),
  })),
  digest: vi.fn((token: string) => (token === 'malformed' ? null : `digest:${token}`)),
} satisfies RefreshTokenProtector;

beforeEach(() => vi.clearAllMocks());

describe('LoginHandler', () => {
  const login = (deps: {
    credentials?: LoginCredentials | null;
    surface?: AuthSessionSurface;
    verifies?: boolean;
    limit?: typeof allowed | typeof limited;
    sessions?: ReturnType<typeof sessionsStub>;
  }) => {
    const accounts = accountsWith(null);
    accounts.findLoginCredentials.mockResolvedValue(deps.credentials ?? null);
    const hasher = hasherStub(deps.verifies ?? true);
    const sessions = deps.sessions ?? sessionsStub();
    const limiter = { takeAttempt: vi.fn(async () => deps.limit ?? allowed) };
    const handler = new LoginHandler(
      accounts as unknown as AccountWriteRepository,
      sessions as unknown as AuthSessionWriteRepository,
      hasher as PasswordHasher,
      limiter as LoginLimiter,
      refreshTokens,
      accessTokens,
    );
    const run = () =>
      handler.execute(
        new LoginCommand({
          email: EMAIL,
          password: 'pw',
          surface: deps.surface ?? 'USER',
          userAgent: null,
          ipAddress: null,
        }),
      );
    return { run, hasher, sessions, accounts };
  };
  const customer = { key: 'CUSTOMER', scope: 'SELF' } as const;
  const manager = { key: 'THEATER_MANAGER', scope: 'THEATER' } as const;
  const verified = { id: ACCOUNT_ID, passwordHash: 'h', isEmailVerified: true, role: customer };

  it('opens a session and returns both tokens', async () => {
    const { run, sessions } = login({ credentials: verified });

    const tokens = await run();

    expect(tokens).toMatchObject({ accessToken: 'access', refreshToken: 'refresh' });
    // The password must still be the one just checked when the session is created.
    expect(sessions.start).toHaveBeenCalledWith(
      ACCOUNT_ID,
      'h',
      'USER',
      expect.any(Date),
      expect.any(Function),
    );
  });

  it('signs an internal account in on the admin side', async () => {
    const { run, sessions } = login({
      credentials: { ...verified, role: manager },
      surface: 'ADMIN',
    });

    await run();

    expect(accessTokens.issue).toHaveBeenCalledWith(expect.objectContaining({ surface: 'ADMIN' }));
    expect(sessions.start).toHaveBeenCalledWith(
      ACCOUNT_ID,
      'h',
      'ADMIN',
      expect.any(Date),
      expect.any(Function),
    );
  });

  it.each<[string, AuthSessionSurface, LoginCredentials['role']]>([
    ['an internal account on the user side', 'USER', manager],
    ['a customer on the admin side', 'ADMIN', customer],
    ['an account without a role', 'USER', null],
  ])('refuses %s like a wrong password', async (_, surface, role) => {
    await expect(
      login({ credentials: { ...verified, role }, surface }).run(),
    ).rejects.toMatchObject({ code: 'AUTH.INVALID_CREDENTIALS' });
  });

  it('runs the hash check even when the email is unknown', async () => {
    const { run, hasher } = login({ credentials: null });

    await expect(run()).rejects.toMatchObject({ code: 'AUTH.INVALID_CREDENTIALS' });
    expect(hasher.verify).toHaveBeenCalledWith(null, 'pw');
  });

  it('gives the same error for a wrong password', async () => {
    await expect(login({ credentials: verified, verifies: false }).run()).rejects.toMatchObject({
      code: 'AUTH.INVALID_CREDENTIALS',
    });
  });

  it('reports an unverified email only after the password matched', async () => {
    const unverified = { ...verified, isEmailVerified: false };

    await expect(login({ credentials: unverified, verifies: false }).run()).rejects.toMatchObject({
      code: 'AUTH.INVALID_CREDENTIALS',
    });
    await expect(login({ credentials: unverified }).run()).rejects.toMatchObject({
      code: 'AUTH.EMAIL_NOT_VERIFIED',
    });
  });

  it('stops before hashing when the email is over its attempt limit', async () => {
    const { run, hasher, accounts } = login({ credentials: verified, limit: limited });

    await expect(run()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(hasher.verify).not.toHaveBeenCalled();
    expect(accounts.findLoginCredentials).not.toHaveBeenCalled();
  });

  it('fails when the password changed before the session could be created', async () => {
    const sessions = sessionsStub();
    sessions.start.mockResolvedValue(null);

    await expect(login({ credentials: verified, sessions }).run()).rejects.toMatchObject({
      code: 'AUTH.INVALID_CREDENTIALS',
    });
  });
});

describe('RefreshHandler', () => {
  const refreshWith = (
    outcome: RefreshOutcome | null,
    revokedReason: string | null = null,
    opts: { sessionSurface?: AuthSessionSurface; role?: SessionOwner['role'] } = {},
  ) => {
    const sessions = sessionsStub();
    sessions.modifyByTokenDigest.mockImplementation(
      async (_d: string, change: (s: AuthSession, t: RefreshToken, o: SessionOwner) => unknown) => {
        if (outcome === null) return null;
        const session = sessionWith({
          surface: opts.sessionSurface ?? 'USER',
          revokedAt: revokedReason ? new Date() : null,
          revokedReason: revokedReason as never,
        });
        const presented = refreshToken(session.id);
        vi.spyOn(session, 'refresh').mockReturnValue(outcome);
        const role = 'role' in opts ? opts.role! : { key: 'CUSTOMER', scope: 'SELF' as const };
        return change(session, presented, { role });
      },
    );
    const handler = new RefreshHandler(
      sessions as unknown as AuthSessionWriteRepository,
      refreshTokens,
      accessTokens,
    );
    return {
      run: (token: string | null, surface: AuthSessionSurface = 'USER') =>
        handler.execute(new RefreshCommand({ refreshToken: token, surface })),
      sessions,
    };
  };

  it('returns new tokens on rotation', async () => {
    await expect(refreshWith('ROTATED').run('t')).resolves.toMatchObject({
      accessToken: 'access',
      refreshToken: 'refresh',
    });
  });

  it('refuses a session of the other side, or an account whose role moved away', async () => {
    await expect(
      refreshWith('ROTATED', null, { sessionSurface: 'ADMIN' }).run('t', 'USER'),
    ).rejects.toMatchObject({ code: 'AUTH.INVALID_REFRESH_TOKEN' });
    await expect(
      refreshWith('ROTATED', null, { role: { key: 'USHER', scope: 'THEATER' } }).run('t'),
    ).rejects.toMatchObject({ code: 'AUTH.INVALID_REFRESH_TOKEN' });
  });

  it.each([null, 'malformed'])(
    'rejects a %s cookie without touching the database',
    async (token) => {
      const { run, sessions } = refreshWith('ROTATED');

      await expect(run(token)).rejects.toMatchObject({ code: 'AUTH.INVALID_REFRESH_TOKEN' });
      expect(sessions.modifyByTokenDigest).not.toHaveBeenCalled();
    },
  );

  it.each<[RefreshOutcome | null, string | null, string, string | undefined]>([
    [null, null, 'AUTH.INVALID_REFRESH_TOKEN', undefined],
    ['REUSED_IN_GRACE', null, 'AUTH.REFRESH_TOKEN_REUSED', undefined],
    ['REPLAY', 'REPLAY', 'AUTH.SESSION_ENDED', 'REPLAY'],
    ['INACTIVE', 'SESSION_LIMIT', 'AUTH.SESSION_ENDED', 'SESSION_LIMIT'],
    ['INACTIVE', null, 'AUTH.SESSION_ENDED', 'EXPIRED'],
  ])('maps %s (%s) to %s', async (outcome, reason, errorCode, detail) => {
    const error = await refreshWith(outcome, reason)
      .run('t')
      .catch((e: unknown) => e);

    expect(error).toMatchObject({ code: errorCode });
    if (detail) expect(error).toMatchObject({ details: [{ code: detail }] });
  });
});

describe('AuthenticateHandler', () => {
  const claims = { accountId: ACCOUNT_ID, sessionId: 's1' };
  const state = (overrides: Partial<SessionGuardState> = {}): SessionGuardState => ({
    accountId: ACCOUNT_ID,
    surface: 'USER',
    role: { key: 'CUSTOMER', scope: 'SELF', clusterId: null, theaterId: null, permissions: [] },
    idleExpiresAt: at(new Date(), 3600),
    absoluteExpiresAt: at(new Date(), 7200),
    revokedAt: null,
    revokedReason: null,
    accountDeletedAt: null,
    ...overrides,
  });
  const authenticate = (verified: typeof claims | null, guard: SessionGuardState | null) => {
    const tokens = { ...accessTokens, verify: vi.fn(async () => verified) };
    const sessions = sessionsStub();
    sessions.findGuardState.mockResolvedValue(guard);
    return new AuthenticateHandler(
      tokens,
      sessions as unknown as AuthSessionWriteRepository,
    ).execute(new AuthenticateQuery({ accessToken: 'token', surface: 'USER' }));
  };

  it('accepts a valid token of an active session', async () => {
    await expect(authenticate(claims, state())).resolves.toEqual({
      ...claims,
      role: { key: 'CUSTOMER', scope: 'SELF', clusterId: null, theaterId: null, permissions: [] },
    });
  });

  it.each<[string, typeof claims | null, SessionGuardState | null]>([
    ['a bad signature', null, state()],
    ['an unknown session', claims, null],
    ['a session of another account', claims, state({ accountId: 'someone-else' })],
    ['a deleted account', claims, state({ accountDeletedAt: new Date() })],
    ['a session of the other side', claims, state({ surface: 'ADMIN' })],
    ['an account whose role was revoked', claims, state({ role: null })],
    [
      'an account whose role moved side',
      claims,
      state({
        role: { key: 'USHER', scope: 'THEATER', clusterId: null, theaterId: 't1', permissions: [] },
      }),
    ],
  ])('rejects %s as an invalid token', async (_, verified, guard) => {
    await expect(authenticate(verified, guard)).rejects.toMatchObject({
      code: 'AUTH.INVALID_ACCESS_TOKEN',
    });
  });

  it.each<[string, SessionGuardState, string]>([
    ['revoked', state({ revokedAt: new Date(), revokedReason: 'LOGOUT' }), 'LOGOUT'],
    ['idle-expired', state({ idleExpiresAt: at(new Date(), -1) }), 'EXPIRED'],
    ['past its absolute expiry', state({ absoluteExpiresAt: at(new Date(), -1) }), 'EXPIRED'],
  ])('rejects a %s session as ended', async (_, guard, detail) => {
    await expect(authenticate(claims, guard)).rejects.toMatchObject({
      code: 'AUTH.SESSION_ENDED',
      details: [{ code: detail }],
    });
  });
});

describe('ForgotPasswordHandler', () => {
  const forgot = (
    existing: { id: string; isEmailVerified: boolean; deletedAt: Date | null } | null,
    limit = allowed as typeof allowed | typeof limited,
  ) => {
    const account = existing ? accountWith({ isEmailVerified: existing.isEmailVerified }) : null;
    const accounts = accountsWith(account);
    accounts.findRegistrationByEmail.mockResolvedValue(existing);
    const otp = {
      issue: vi.fn(({ accountId, purpose, now }: Parameters<EmailOtpProtector['issue']>[0]) => ({
        otp: '123456',
        code: code(purpose, { accountId, now }),
      })),
      matches: vi.fn(),
    } satisfies EmailOtpProtector;
    const limiter = {
      takeIssuance: vi.fn(),
      takePasswordResetIssuance: vi.fn(async () => limit),
    } satisfies EmailVerificationLimiter;
    const mailer = {
      sendVerificationCode: vi.fn(),
      sendInvitation: vi.fn(),
      sendPasswordResetCode: vi.fn(),
    } satisfies AuthMailer;
    const handler = new ForgotPasswordHandler(
      accounts as unknown as AccountWriteRepository,
      otp,
      limiter,
      mailer,
    );
    return {
      run: () => handler.execute(new ForgotPasswordCommand({ email: EMAIL })),
      mailer,
      accounts,
      account,
    };
  };

  it('emails a reset code and returns its id', async () => {
    const { run, mailer, account } = forgot({
      id: ACCOUNT_ID,
      isEmailVerified: true,
      deletedAt: null,
    });

    const accepted = await run();

    expect(accepted.resetId).toBe(account!.latestPasswordReset!.id);
    expect(account!.latestPasswordReset!.purpose).toBe(EMAIL_CODE_PURPOSE.PASSWORD_RESET);
    expect(mailer.sendPasswordResetCode).toHaveBeenCalledWith(
      expect.objectContaining({
        to: Email.create(EMAIL),
        otp: '123456',
        resetId: accepted.resetId,
      }),
    );
  });

  it('sends a code to an unverified account too', async () => {
    const { run, mailer } = forgot({ id: ACCOUNT_ID, isEmailVerified: false, deletedAt: null });

    await run();

    expect(mailer.sendPasswordResetCode).toHaveBeenCalledOnce();
  });

  it.each([
    ['an unknown email', null],
    ['a deleted account', { id: ACCOUNT_ID, isEmailVerified: true, deletedAt: new Date() }],
  ])('answers the same for %s, without email', async (_, existing) => {
    const { run, mailer } = forgot(existing);

    const accepted = await run();

    expect(accepted.resetId).toMatch(/^[0-9a-f-]{36}$/);
    expect(accepted.expiresInSeconds).toBeGreaterThan(0);
    expect(mailer.sendPasswordResetCode).not.toHaveBeenCalled();
  });

  it('applies the limit before looking the email up', async () => {
    const { run, accounts } = forgot(null, limited);

    await expect(run()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(accounts.findRegistrationByEmail).not.toHaveBeenCalled();
  });
});

describe('ResetPasswordHandler', () => {
  const resetWith = (owner: { accountId: string } | null, matches: boolean) => {
    const reset = code(EMAIL_CODE_PURPOSE.PASSWORD_RESET, { now: new Date() });
    const account = accountWith({ passwordReset: reset });
    const accounts = accountsWith(account);
    accounts.findOwnerOfPasswordReset.mockResolvedValue(owner);
    const otp = { issue: vi.fn(), matches: vi.fn(() => matches) } satisfies EmailOtpProtector;
    const handler = new ResetPasswordHandler(
      accounts as unknown as AccountWriteRepository,
      otp,
      hasherStub(true),
    );
    const run = (resetId = reset.id) =>
      handler.execute(
        new ResetPasswordCommand({ resetId, otp: '123456', newPassword: 'new-pw-1' }),
      );
    return { run, account };
  };

  it('resets the password and asks for every session to end', async () => {
    const { run, account } = resetWith({ accountId: ACCOUNT_ID }, true);

    await expect(run()).resolves.toEqual({ passwordReset: true });
    expect(account.passwordHash).toBe('hashed:new-pw-1');
    expect(account.sessionRevocation?.reason).toBe('PASSWORD_RESET');
  });

  it('rejects an unknown reset id', async () => {
    await expect(resetWith(null, true).run()).rejects.toMatchObject({
      code: 'AUTH.INVALID_EMAIL_OTP',
    });
  });

  it('rejects a wrong OTP', async () => {
    const { run, account } = resetWith({ accountId: ACCOUNT_ID }, false);

    await expect(run()).rejects.toMatchObject({ code: 'AUTH.INVALID_EMAIL_OTP' });
    expect(account.passwordHash).toBe('hash-1');
  });
});

describe('ChangePasswordHandler', () => {
  const changeWith = (
    opts: { verifies?: boolean; limit?: typeof allowed | typeof limited; storedHash?: string } = {},
  ) => {
    const account = accountWith({ passwordHash: opts.storedHash ?? 'hash-1' });
    const accounts = accountsWith(account);
    accounts.findPasswordCheck.mockResolvedValue({
      email: Email.create(EMAIL),
      passwordHash: 'hash-1',
    });
    const hasher = hasherStub(opts.verifies ?? true);
    const limiter = { takeAttempt: vi.fn(async () => opts.limit ?? allowed) };
    const handler = new ChangePasswordHandler(
      accounts as unknown as AccountWriteRepository,
      hasher,
      limiter,
    );
    const run = () =>
      handler.execute(
        new ChangePasswordCommand({
          accountId: ACCOUNT_ID,
          currentPassword: 'old',
          newPassword: 'new-pw-1',
        }),
      );
    return { run, account, hasher, limiter };
  };

  it('changes the password and asks for every session to end', async () => {
    const { run, account, limiter } = changeWith();

    await expect(run()).resolves.toEqual({ passwordChanged: true });
    expect(account.passwordHash).toBe('hashed:new-pw-1');
    expect(account.sessionRevocation?.reason).toBe('PASSWORD_CHANGED');
    // Counted against the same budget as login.
    expect(limiter.takeAttempt).toHaveBeenCalledWith(Email.create(EMAIL));
  });

  it('rejects a wrong current password', async () => {
    const { run, account } = changeWith({ verifies: false });

    await expect(run()).rejects.toMatchObject({ code: 'AUTH.INVALID_CURRENT_PASSWORD' });
    expect(account.passwordHash).toBe('hash-1');
  });

  it('stops before checking when over the attempt limit', async () => {
    const { run, hasher } = changeWith({ limit: limited });

    await expect(run()).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(hasher.verify).not.toHaveBeenCalled();
  });

  it('rejects when the password changed after it was checked', async () => {
    const { run, account } = changeWith({ storedHash: 'hash-from-a-reset' });

    await expect(run()).rejects.toMatchObject({ code: 'AUTH.INVALID_CURRENT_PASSWORD' });
    expect(account.passwordHash).toBe('hash-from-a-reset');
  });
});
