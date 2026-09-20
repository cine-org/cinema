import { z } from 'zod';

const envBoolean = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return value;
}, z.boolean());

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_ORIGIN: z.url().optional(),
  API_PREFIX: z.string().default('/api'),
  PORT: z.coerce.number().default(3000),
  CORS_ORIGINS: z.string().default(''),
  ENABLE_SWAGGER: envBoolean.default(false),
  LOG_LEVEL: z.enum(['log', 'error', 'warn', 'debug', 'verbose']).default('log'),

  DATABASE_URL: z.url(),
  AUTH_JWT_PRIVATE_KEY_BASE64: z.string().default(''),
  AUTH_JWT_PUBLIC_KEY_BASE64: z.string().default(''),
  AUTH_JWT_ISSUER: z.string().default('cinema-api'),
  AUTH_JWT_AUDIENCE: z.string().default('cinema-web'),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(2592000),
  AUTH_VERIFICATION_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  AUTH_RESET_TTL_SECONDS: z.coerce.number().int().positive().default(1800),
  AUTH_OUTBOX_ENCRYPTION_KEY: z.string().default(''),
  AUTH_REFRESH_COOKIE_NAME: z.string().default('cinema_refresh'),
  WEB_ORIGIN: z.url().default('http://localhost:4000'),
});

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables');
  const tree = z.treeifyError(parsed.error);
  console.error(JSON.stringify(tree, null, 2));
  process.exit(1);
}

export const env: Env = Object.freeze(parsed.data);
