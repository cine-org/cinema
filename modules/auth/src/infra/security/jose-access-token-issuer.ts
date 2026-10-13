import { errors, jwtVerify, SignJWT } from 'jose';
import type { AccessTokenClaims, AccessTokenIssuer, IssuedAccessToken } from '../../app';
import { AUTH_SESSION_POLICY } from '../../domain';

const ALGORITHM = 'HS256';
const ISSUER = 'cinema-api';
const AUDIENCE = 'cinema-user';
const MIN_KEY_BYTES = 32;

// HS256: the api both signs and verifies, so one shared secret is enough.
export class JoseAccessTokenIssuer implements AccessTokenIssuer {
  private readonly key: Uint8Array;

  constructor(base64Key: string) {
    const key = Buffer.from(base64Key, 'base64');
    // Canonical check: Node silently skips invalid base64 characters.
    if (key.length < MIN_KEY_BYTES || key.toString('base64') !== base64Key) {
      throw new Error(`Access token key must be base64 of at least ${MIN_KEY_BYTES} random bytes`);
    }
    this.key = new Uint8Array(key);
  }

  async issue(input: AccessTokenClaims & { now: Date }): Promise<IssuedAccessToken> {
    const issuedAt = Math.floor(input.now.getTime() / 1000);
    const expiresAt = issuedAt + AUTH_SESSION_POLICY.accessTokenTtlSeconds;
    const token = await new SignJWT({ sid: input.sessionId })
      .setProtectedHeader({ alg: ALGORITHM, typ: 'JWT' })
      .setSubject(input.accountId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt(issuedAt)
      .setExpirationTime(expiresAt)
      .sign(this.key);
    return { token, expiresAt: new Date(expiresAt * 1000) };
  }

  async verify(token: string): Promise<AccessTokenClaims | null> {
    try {
      const { payload } = await jwtVerify(token, this.key, {
        algorithms: [ALGORITHM],
        issuer: ISSUER,
        audience: AUDIENCE,
        requiredClaims: ['sub', 'sid', 'exp'],
      });
      if (typeof payload.sub !== 'string' || typeof payload.sid !== 'string') return null;
      return { accountId: payload.sub, sessionId: payload.sid };
    } catch (error) {
      if (error instanceof errors.JOSEError) return null;
      throw error;
    }
  }
}
