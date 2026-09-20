import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import type { AccessTokenClaims } from '@repo/contracts';
import { AUTH_OPTIONS } from './auth.constants';
import type { AuthModuleOptions } from './auth.types';
import { AuthError } from './auth.exception';

@Injectable()
export class TokenService {
  constructor(@Inject(AUTH_OPTIONS) private readonly options: AuthModuleOptions) {}

  randomToken(): string {
    return randomBytes(32).toString('base64url');
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async signAccessToken(
    userId: string,
    sessionId: string,
  ): Promise<{ token: string; tokenId: string }> {
    const { SignJWT, importPKCS8 } = await import('jose');
    const key = await importPKCS8(this.options.jwtPrivateKey, 'RS256');
    const tokenId = randomUUID();
    const token = await new SignJWT({ sid: sessionId })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT' })
      .setSubject(userId)
      .setJti(tokenId)
      .setIssuer(this.options.jwtIssuer)
      .setAudience(this.options.jwtAudience)
      .setIssuedAt()
      .setExpirationTime(`${this.options.accessTokenTtlSeconds}s`)
      .sign(key);
    return { token, tokenId };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    try {
      const { importSPKI, jwtVerify } = await import('jose');
      const key = await importSPKI(this.options.jwtPublicKey, 'RS256');
      const { payload } = await jwtVerify(token, key, {
        algorithms: ['RS256'],
        issuer: this.options.jwtIssuer,
        audience: this.options.jwtAudience,
      });
      if (
        !payload.sub ||
        !payload.jti ||
        typeof payload.sid !== 'string' ||
        !payload.iat ||
        !payload.exp
      )
        throw AuthError.invalidToken();
      return {
        sub: payload.sub,
        sid: payload.sid,
        jti: payload.jti,
        iss: payload.iss!,
        aud: this.options.jwtAudience,
        iat: payload.iat,
        exp: payload.exp,
      };
    } catch {
      throw AuthError.invalidToken();
    }
  }

  encryptOutbox(payload: unknown): string {
    const key = Buffer.from(this.options.outboxEncryptionKey, 'base64');
    if (key.length !== 32) throw new Error('AUTH_OUTBOX_ENCRYPTION_KEY must decode to 32 bytes');
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString('base64url')).join('.');
  }

  decryptOutbox(value: string): unknown {
    const [iv, tag, encrypted] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
    if (!iv || !tag || !encrypted) throw new Error('Invalid encrypted outbox payload');
    const decipher = createDecipheriv(
      'aes-256-gcm',
      Buffer.from(this.options.outboxEncryptionKey, 'base64'),
      iv,
    );
    decipher.setAuthTag(tag);
    return JSON.parse(
      Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8'),
    ) as unknown;
  }
}
