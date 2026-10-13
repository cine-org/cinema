import type { Env } from './env';

export function createCacheConfig(env: Env) {
  return Object.freeze({
    url: env.REDIS_URL,
  });
}

export type CacheConfig = ReturnType<typeof createCacheConfig>;
