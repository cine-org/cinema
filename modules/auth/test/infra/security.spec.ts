import { randomBytes } from 'node:crypto';
import { Email } from '@repo/common';
import { SignJWT } from 'jose';
import { describe, expect, it } from 'vitest';
import { AUTH_SESSION_POLICY, EMAIL_CODE_PURPOSE, EmailCode } from '../../src/domain';
import {
  Argon2PasswordHasher,
  HmacEmailOtpProtector,
  JoseAccessTokenIssuer,
  Sha256RefreshTokenProtector,
} from '../../src/infra';
import { at, NOW } from '../fixtures';

const key = () => randomBytes(32).toString('base64');

describe('Sha256RefreshTokenProtector', () => {
  const protector = new Sha256RefreshTokenProtector();

  it('stores only the digest of the token it hands out', () => {
    const { token, refreshToken } = protector.issue({ sessionId: 's1', now: NOW });

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(refreshToken.digest).not.toContain(token);
    expect(protector.digest(token)).toBe(refreshToken.digest);
    expect(refreshToken.sessionId).toBe('s1');
  });

  it('issues a different token each time', () => {
    const a = protector.issue({ sessionId: 's1', now: NOW });
    const b = protector.issue({ sessionId: 's1', now: NOW });

    expect(a.token).not.toBe(b.token);
  });

  it.each(['', 'short', 'x'.repeat(43) + '=', 'a'.repeat(42) + '!'])(
    'rejects %j without hashing it',
    (token) => {
      expect(protector.digest(token)).toBeNull();
    },
  );
});

describe('JoseAccessTokenIssuer', () => {
  const issuer = new JoseAccessTokenIssuer(key());

  it('round-trips the account and session', async () => {
    const issued = await issuer.issue({ accountId: 'a1', sessionId: 's1', now: new Date() });

    await expect(issuer.verify(issued.token)).resolves.toEqual({
      accountId: 'a1',
      sessionId: 's1',
    });
  });

  it('expires after the access token lifetime', async () => {
    const issued = await issuer.issue({ accountId: 'a1', sessionId: 's1', now: NOW });

    expect(issued.expiresAt).toEqual(at(NOW, AUTH_SESSION_POLICY.accessTokenTtlSeconds));
    await expect(issuer.verify(issued.token)).resolves.toBeNull();
  });

  it('rejects a token signed with another key', async () => {
    const other = new JoseAccessTokenIssuer(key());
    const issued = await other.issue({ accountId: 'a1', sessionId: 's1', now: new Date() });

    await expect(issuer.verify(issued.token)).resolves.toBeNull();
  });

  it('rejects a tampered token', async () => {
    const { token } = await issuer.issue({ accountId: 'a1', sessionId: 's1', now: new Date() });
    const [header, , signature] = token.split('.');
    const payload = Buffer.from(JSON.stringify({ sub: 'a2', sid: 's1' })).toString('base64url');

    await expect(issuer.verify(`${header}.${payload}.${signature}`)).resolves.toBeNull();
  });

  it('rejects a token without a session id', async () => {
    const secret = key();
    const token = await new SignJWT({})
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('a1')
      .setIssuer('cinema-api')
      .setAudience('cinema-user')
      .setExpirationTime('5m')
      .sign(Buffer.from(secret, 'base64'));

    await expect(new JoseAccessTokenIssuer(secret).verify(token)).resolves.toBeNull();
  });

  it('refuses a short key', () => {
    expect(() => new JoseAccessTokenIssuer(randomBytes(16).toString('base64'))).toThrow();
  });
});

describe('HmacEmailOtpProtector', () => {
  const protector = new HmacEmailOtpProtector(key());
  const email = Email.create('user@cinema.local');

  it('matches the issued OTP only', () => {
    const { otp, code } = protector.issue({
      accountId: 'a1',
      email,
      purpose: EMAIL_CODE_PURPOSE.PASSWORD_RESET,
      now: NOW,
    });

    expect(otp).toMatch(/^\d{6}$/);
    expect(protector.matches(code, email, otp)).toBe(true);
    expect(protector.matches(code, email, otp === '000000' ? '000001' : '000000')).toBe(false);
    expect(protector.matches(code, email, 'abcdef')).toBe(false);
  });

  it('binds the email', () => {
    const { otp, code } = protector.issue({
      accountId: 'a1',
      email,
      purpose: EMAIL_CODE_PURPOSE.PASSWORD_RESET,
      now: NOW,
    });

    expect(protector.matches(code, Email.create('other@cinema.local'), otp)).toBe(false);
  });

  it('binds the purpose: a verification digest does not match as a reset code', () => {
    const { otp, code } = protector.issue({
      accountId: 'a1',
      email,
      purpose: EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION,
      now: NOW,
    });
    // The same stored row, presented as a reset code.
    const asReset = EmailCode.restore({
      id: code.id,
      accountId: code.accountId,
      purpose: EMAIL_CODE_PURPOSE.PASSWORD_RESET,
      secretDigest: code.secretDigest,
      failedAttempts: 0,
      expiresAt: code.expiresAt,
      consumedAt: null,
      revokedAt: null,
      createdAt: code.createdAt,
    });

    expect(protector.matches(asReset, email, otp)).toBe(false);
  });
});

describe('Argon2PasswordHasher', () => {
  const hasher = new Argon2PasswordHasher();

  it('verifies the right password only', async () => {
    const hash = await hasher.hash('password-1');

    await expect(hasher.verify(hash, 'password-1')).resolves.toBe(true);
    await expect(hasher.verify(hash, 'password-2')).resolves.toBe(false);
  });

  it('returns false without an account, after doing the same work', async () => {
    await expect(hasher.verify(null, 'password-1')).resolves.toBe(false);
  });
});
