import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3000),
  API_ORIGIN: z.url().optional(),
  API_PREFIX: z.string().default('/api'),
  CORS_ORIGINS: z.string().default(''),
  ENABLE_SWAGGER: z.coerce.boolean().default(false),
  LOG_LEVEL: z.enum(['log', 'error', 'warn', 'debug', 'verbose']).default('log'),

  DATABASE_URL: z.url(),
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
