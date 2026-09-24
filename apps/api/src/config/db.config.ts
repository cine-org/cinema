import type { Env } from './env';

export function createDbConfig(env: Env) {
  return Object.freeze({
    url: env.DATABASE_URL,
    readUrl: env.DATABASE_URL_RO,
  });
}

export type DbConfig = ReturnType<typeof createDbConfig>;
