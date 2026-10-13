import { describe, expect, it } from 'vitest';
import { EMAIL_CODE_PURPOSE, PASSWORD_RESET_POLICY } from '../../../src/domain';
import { accountWith, at, code, NOW } from '../../fixtures';

const RESET = EMAIL_CODE_PURPOSE.PASSWORD_RESET;
const VERIFY = EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION;
const matches = () => true;
const wrong = () => false;

describe('Account', () => {
  describe('requestPasswordReset', () => {
    it('replaces and revokes the active reset code', () => {
      const old = code(RESET);
      const account = accountWith({ passwordReset: old });
      const next = code(RESET);

      account.requestPasswordReset(next, NOW);

      expect(account.latestPasswordReset).toBe(next);
      expect(account.replacedCodes).toEqual([old]);
      expect(old.revokedAt).toEqual(NOW);
    });

    it('refuses a code of another purpose', () => {
      expect(() => accountWith().requestPasswordReset(code(VERIFY), NOW)).toThrow();
    });

    it('works on an unverified account too', () => {
      const account = accountWith({ isEmailVerified: false });

      account.requestPasswordReset(code(RESET), NOW);

      expect(account.latestPasswordReset).not.toBeNull();
    });
  });

  describe('resetPassword', () => {
    it('sets the password, consumes the code and ends every session', () => {
      const reset = code(RESET);
      const account = accountWith({ passwordReset: reset });

      expect(account.resetPassword(reset.id, matches, 'hash-2', NOW)).toBe('RESET');

      expect(account.passwordHash).toBe('hash-2');
      expect(reset.consumedAt).toEqual(NOW);
      expect(account.sessionRevocation).toEqual({ reason: 'PASSWORD_RESET', at: NOW });
    });

    it('verifies an unverified email and revokes its pending verification code', () => {
      const verification = code(VERIFY);
      const reset = code(RESET);
      const account = accountWith({ isEmailVerified: false, verification, passwordReset: reset });

      account.resetPassword(reset.id, matches, 'hash-2', NOW);

      expect(account.isEmailVerified).toBe(true);
      expect(verification.revokedAt).toEqual(NOW);
    });

    it('records a wrong OTP and changes nothing else', () => {
      const reset = code(RESET);
      const account = accountWith({ passwordReset: reset });

      expect(account.resetPassword(reset.id, wrong, 'hash-2', NOW)).toBe('INVALID');

      expect(reset.failedAttempts).toBe(1);
      expect(account.passwordHash).toBe('hash-1');
      expect(account.sessionRevocation).toBeNull();
    });

    it('locks the code after the last allowed wrong OTP', () => {
      const reset = code(RESET);
      const account = accountWith({ passwordReset: reset });
      const results = Array.from({ length: PASSWORD_RESET_POLICY.maxFailedAttempts }, () =>
        account.resetPassword(reset.id, wrong, 'hash-2', NOW),
      );

      expect(results.at(-1)).toBe('TOO_MANY_ATTEMPTS');
      expect(account.resetPassword(reset.id, matches, 'hash-2', NOW)).toBe('TOO_MANY_ATTEMPTS');
      expect(account.passwordHash).toBe('hash-1');
    });

    it.each([
      ['an unknown id', (id: string) => `${id}-other`, NOW],
      ['an expired code', (id: string) => id, at(NOW, PASSWORD_RESET_POLICY.otpTtlSeconds)],
    ])('refuses %s', (_, idOf, now) => {
      const reset = code(RESET);
      const account = accountWith({ passwordReset: reset });

      expect(account.resetPassword(idOf(reset.id), matches, 'hash-2', now)).toBe('INVALID');
      expect(account.passwordHash).toBe('hash-1');
    });

    it('refuses a code already used', () => {
      const reset = code(RESET);
      const account = accountWith({ passwordReset: reset });
      account.resetPassword(reset.id, matches, 'hash-2', NOW);

      expect(account.resetPassword(reset.id, matches, 'hash-3', NOW)).toBe('INVALID');
      expect(account.passwordHash).toBe('hash-2');
    });

    it('cannot use a verification code', () => {
      const verification = code(VERIFY);
      const account = accountWith({ isEmailVerified: false, verification });

      expect(account.resetPassword(verification.id, matches, 'hash-2', NOW)).toBe('INVALID');
    });
  });

  describe('changePassword', () => {
    it('sets the password, revokes a pending reset code and ends every session', () => {
      const reset = code(RESET);
      const account = accountWith({ passwordReset: reset });

      expect(account.changePassword('hash-1', 'hash-2', NOW)).toBe(true);

      expect(account.passwordHash).toBe('hash-2');
      expect(reset.revokedAt).toEqual(NOW);
      expect(account.sessionRevocation).toEqual({ reason: 'PASSWORD_CHANGED', at: NOW });
    });

    it('refuses when the password changed since it was checked', () => {
      const account = accountWith({ passwordHash: 'hash-other' });

      expect(account.changePassword('hash-1', 'hash-2', NOW)).toBe(false);
      expect(account.passwordHash).toBe('hash-other');
      expect(account.sessionRevocation).toBeNull();
    });
  });

  it('keeps verification codes and reset codes apart', () => {
    const verification = code(VERIFY);
    const account = accountWith({ isEmailVerified: false, verification });

    account.requestPasswordReset(code(RESET), NOW);

    expect(account.latestVerification).toBe(verification);
    expect(verification.isActive).toBe(true);
  });
});
