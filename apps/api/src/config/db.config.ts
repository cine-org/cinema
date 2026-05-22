import { env } from './env';

export const dbConfig = Object.freeze({
  url: env.DATABASE_URL,
});

export type DbConfig = typeof dbConfig;
