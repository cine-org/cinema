import type { Env } from './env';

export function createAuthConfig(env: Env) {
  return Object.freeze({
    otpHmacKey: env.AUTH_OTP_HMAC_KEY,
    jwtSecret: env.AUTH_JWT_SECRET,
    smtp: Object.freeze({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
      from: env.SMTP_FROM,
    }),
  });
}

export type AuthConfig = ReturnType<typeof createAuthConfig>;
