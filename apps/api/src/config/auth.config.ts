import { generateKeyPairSync } from 'node:crypto';
import { env } from './env';

const configuredPrivate = env.AUTH_JWT_PRIVATE_KEY_BASE64
  ? Buffer.from(env.AUTH_JWT_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
  : undefined;
const configuredPublic = env.AUTH_JWT_PUBLIC_KEY_BASE64
  ? Buffer.from(env.AUTH_JWT_PUBLIC_KEY_BASE64, 'base64').toString('utf8')
  : undefined;

if (
  env.NODE_ENV === 'production' &&
  (!configuredPrivate || !configuredPublic || !env.AUTH_OUTBOX_ENCRYPTION_KEY)
) {
  throw new Error('JWT keys and AUTH_OUTBOX_ENCRYPTION_KEY are required in production');
}

if (configuredPrivate && !configuredPrivate.includes('BEGIN PRIVATE KEY'))
  throw new Error('AUTH_JWT_PRIVATE_KEY_BASE64 must contain a base64-encoded PKCS#8 PEM key');
if (configuredPublic && !configuredPublic.includes('BEGIN PUBLIC KEY'))
  throw new Error('AUTH_JWT_PUBLIC_KEY_BASE64 must contain a base64-encoded SPKI PEM key');
if (
  env.AUTH_OUTBOX_ENCRYPTION_KEY &&
  Buffer.from(env.AUTH_OUTBOX_ENCRYPTION_KEY, 'base64').length !== 32
) {
  throw new Error('AUTH_OUTBOX_ENCRYPTION_KEY must decode to exactly 32 bytes');
}

const generated =
  !configuredPrivate || !configuredPublic
    ? generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      })
    : undefined;

export const authConfig = Object.freeze({
  jwtPrivateKey: configuredPrivate ?? generated!.privateKey,
  jwtPublicKey: configuredPublic ?? generated!.publicKey,
  jwtIssuer: env.AUTH_JWT_ISSUER,
  jwtAudience: env.AUTH_JWT_AUDIENCE,
  accessTokenTtlSeconds: env.AUTH_ACCESS_TOKEN_TTL_SECONDS,
  sessionTtlSeconds: env.AUTH_SESSION_TTL_SECONDS,
  verificationTtlSeconds: env.AUTH_VERIFICATION_TTL_SECONDS,
  resetTtlSeconds: env.AUTH_RESET_TTL_SECONDS,
  outboxEncryptionKey: env.AUTH_OUTBOX_ENCRYPTION_KEY || Buffer.alloc(32).toString('base64'),
  refreshCookieName: env.AUTH_REFRESH_COOKIE_NAME,
  webOrigin: env.WEB_ORIGIN,
});

export type AuthConfig = typeof authConfig;
