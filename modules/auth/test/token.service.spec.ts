import { generateKeyPairSync } from 'node:crypto';
import { decodeJwt } from 'jose';
import { describe, expect, it } from 'vitest';
import type { AuthModuleOptions } from '../src/auth.types';
import { TokenService } from '../src/token.service';

const keys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const options: AuthModuleOptions = {
  jwtPrivateKey: keys.privateKey,
  jwtPublicKey: keys.publicKey,
  jwtIssuer: 'test-issuer',
  jwtAudience: 'test-audience',
  accessTokenTtlSeconds: 900,
  sessionTtlSeconds: 2_592_000,
  verificationTtlSeconds: 86_400,
  resetTtlSeconds: 1_800,
  outboxEncryptionKey: Buffer.alloc(32, 7).toString('base64'),
  webOrigin: 'https://cinema.test',
};

describe('TokenService', () => {
  it('issues a verified RS256 access token with identifiers only', async () => {
    const service = new TokenService(options);
    const { token, tokenId } = await service.signAccessToken('user-id', 'session-id');
    const claims = await service.verifyAccessToken(token);
    expect(claims).toMatchObject({
      sub: 'user-id',
      sid: 'session-id',
      jti: tokenId,
      iss: 'test-issuer',
      aud: 'test-audience',
    });
    expect(Object.keys(decodeJwt(token)).sort()).toEqual([
      'aud',
      'exp',
      'iat',
      'iss',
      'jti',
      'sid',
      'sub',
    ]);
  });

  it('stores opaque tokens as deterministic SHA-256 hashes', () => {
    const service = new TokenService(options);
    const token = service.randomToken();
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(service.hash(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(service.hash(token)).not.toBe(token);
  });

  it('round-trips encrypted outbox payloads without plaintext leakage', () => {
    const service = new TokenService(options);
    const encrypted = service.encryptOutbox({ token: 'secret-token', email: 'user@example.test' });
    expect(encrypted).not.toContain('secret-token');
    expect(service.decryptOutbox(encrypted)).toEqual({
      token: 'secret-token',
      email: 'user@example.test',
    });
  });
});
