import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3000),
  API_ORIGIN: z.url().optional(),
  CORS_ORIGINS: z.string().default(''),
  ENABLE_SWAGGER: z.stringbool().default(false),
  LOG_LEVEL: z.enum(['log', 'error', 'warn', 'debug', 'verbose']).default('log'),
  // Proxies in front of the API whose X-Forwarded-For is trusted: a hop count ("1") or
  // comma-separated addresses/CIDRs. Unset trusts none (direct connections, local dev).
  TRUST_PROXY: z
    .string()
    .optional()
    .refine((value) => value?.trim().toLowerCase() !== 'true', {
      message: 'trusting every proxy lets clients fake their IP; use a hop count or addresses',
    }),

  DATABASE_URL: z.url(),
  // Read-only role; unset means reads share DATABASE_URL.
  DATABASE_URL_RO: z.url().optional(),

  // Rate limits; the cache client accepts redis:// and rediss://.
  REDIS_URL: z.url(),
});

export type Env = z.infer<typeof envSchema>;

// Called at bootstrap, never at import, so tooling can load modules without env.
export function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const tree = JSON.stringify(z.treeifyError(parsed.error), null, 2);
    throw new Error(`Invalid environment variables\n${tree}`);
  }
  return Object.freeze(parsed.data);
}
