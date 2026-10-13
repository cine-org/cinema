import { Email } from '@repo/common';
import { EMAIL_CODE_PURPOSE, EmailCode } from '@repo/auth';
import { setupAuth, type AuthSetup } from './setup';

describe('Prisma account repository (int)', () => {
  let t: AuthSetup;

  beforeAll(async () => {
    t = await setupAuth();
  });

  afterAll(() => t.close());

  const resetCode = (accountId: string) =>
    EmailCode.issue({
      id: crypto.randomUUID(),
      accountId,
      purpose: EMAIL_CODE_PURPOSE.PASSWORD_RESET,
      secretDigest: 'digest',
      now: new Date(),
    });

  it('ends every session in the same save as a password change', async () => {
    const accountId = await t.createAccount('hash-1');
    await t.login(accountId);
    await t.login(accountId);

    const changed = await t.accounts.modify(accountId, (account) =>
      account.changePassword('hash-1', 'hash-2', new Date()),
    );

    expect(changed).toBe(true);
    const user = await t.db.user.findUniqueOrThrow({ where: { id: accountId } });
    expect(user.passwordHash).toBe('hash-2');
    const reasons = await t.db.authSession.findMany({
      where: { accountId },
      select: { revokedReason: true },
    });
    expect(reasons).toEqual([
      { revokedReason: 'PASSWORD_CHANGED' },
      { revokedReason: 'PASSWORD_CHANGED' },
    ]);
  });

  it('saves nothing when the change refuses', async () => {
    const accountId = await t.createAccount('hash-now');
    await t.login(accountId, 'hash-now');

    const changed = await t.accounts.modify(accountId, (account) =>
      account.changePassword('hash-before', 'hash-2', new Date()),
    );

    expect(changed).toBe(false);
    expect(await t.activeSessions(accountId)).toHaveLength(1);
  });

  it('keeps one active reset code: a new request revokes the previous one', async () => {
    const accountId = await t.createAccount();
    const first = resetCode(accountId);
    const second = resetCode(accountId);

    await t.accounts.modify(accountId, (account) =>
      account.requestPasswordReset(first, new Date()),
    );
    await t.accounts.modify(accountId, (account) =>
      account.requestPasswordReset(second, new Date()),
    );

    const codes = await t.db.authChallenge.findMany({
      where: { accountId, purpose: 'PASSWORD_RESET' },
      orderBy: { createdAt: 'asc' },
    });
    expect(codes.map((c) => [c.id, c.revokedAt !== null])).toEqual([
      [first.id, true],
      [second.id, false],
    ]);
  });

  it('loads the latest code of each purpose apart', async () => {
    const accountId = await t.createAccount();
    const reset = resetCode(accountId);
    await t.accounts.modify(accountId, (account) =>
      account.requestPasswordReset(reset, new Date()),
    );

    const loaded = await t.accounts.modify(accountId, (account) => ({
      reset: account.latestPasswordReset?.id,
      verification: account.latestVerification,
    }));

    expect(loaded).toEqual({ reset: reset.id, verification: null });
  });

  it('finds the owner of a reset code, but not of a verification code', async () => {
    const accountId = await t.createAccount();
    const reset = resetCode(accountId);
    await t.accounts.modify(accountId, (account) =>
      account.requestPasswordReset(reset, new Date()),
    );

    expect(await t.accounts.findOwnerOfPasswordReset(reset.id)).toEqual({ accountId });
    expect(await t.accounts.findOwnerOfVerification(reset.id)).toBeNull();
  });

  it('finds no login credentials for a deleted account', async () => {
    const accountId = await t.createAccount();
    const { email } = await t.db.user.update({
      where: { id: accountId },
      data: { deletedAt: new Date() },
    });

    expect(await t.accounts.findLoginCredentials(Email.create(email!))).toBeNull();
    expect(await t.accounts.findPasswordCheck(accountId)).toBeNull();
  });
});
