import { z } from 'zod';

const envBoolean = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return value;
}, z.boolean());

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.url(),
  AUTH_OUTBOX_ENCRYPTION_KEY: z.string(),
  WEB_ORIGIN: z.url().default('http://localhost:4000'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().int().positive().default(1025),
  SMTP_SECURE: envBoolean.default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASSWORD: z.string().default(''),
  MAIL_FROM: z.string().default('Cinema <noreply@cinema.local>'),
  OUTBOX_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(5000),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success)
  throw new Error(
    `Invalid integration environment: ${JSON.stringify(z.treeifyError(parsed.error))}`,
  );
if (Buffer.from(parsed.data.AUTH_OUTBOX_ENCRYPTION_KEY, 'base64').length !== 32)
  throw new Error('AUTH_OUTBOX_ENCRYPTION_KEY must decode to exactly 32 bytes');
if (parsed.data.SMTP_USER && !parsed.data.SMTP_PASSWORD)
  throw new Error('SMTP_PASSWORD is required when SMTP_USER is configured');
export const config = Object.freeze(parsed.data);
