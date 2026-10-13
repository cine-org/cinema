import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { IssuedRefreshToken, RefreshTokenProtector } from '../../app';
import { RefreshToken } from '../../domain';

const TOKEN_BYTES = 32;
// base64url of 32 bytes, no padding.
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

// Tokens are 256 random bits, so a fast unsalted SHA-256 is enough to store them: unlike a
// password there is nothing to brute-force.
export class Sha256RefreshTokenProtector implements RefreshTokenProtector {
  issue(input: { sessionId: string; now: Date }): IssuedRefreshToken {
    const token = randomBytes(TOKEN_BYTES).toString('base64url');
    return {
      token,
      refreshToken: RefreshToken.issue({
        id: randomUUID(),
        sessionId: input.sessionId,
        digest: sha256(token),
        now: input.now,
      }),
    };
  }

  digest(token: string): string | null {
    return TOKEN_PATTERN.test(token) ? sha256(token) : null;
  }
}

function sha256(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
