import type { RedisOptions } from 'ioredis';

export type RedisSentinelNode = {
  readonly host: string;
  readonly port: number;
};

type CacheRedisCommonOptions = {
  readonly keyPrefix?: string;
  readonly connectTimeoutMs?: number;
  // Per-command timeout; unset waits as long as the connection allows.
  readonly commandTimeoutMs?: number;
  // false: commands fail at once while disconnected instead of queueing until reconnect.
  readonly enableOfflineQueue?: boolean;
  readonly maxRetriesPerRequest?: number;
  // false: the app still starts when Redis is down; the client keeps reconnecting in the background.
  readonly requireConnectionOnStartup?: boolean;
};

export type CacheRedisStandaloneOptions = CacheRedisCommonOptions & {
  readonly mode: 'standalone';
  readonly url: string;
};

export type CacheRedisSentinelOptions = CacheRedisCommonOptions & {
  readonly mode: 'sentinel';
  readonly masterName: string;
  readonly sentinels: RedisSentinelNode[];
  readonly username?: string;
  readonly password?: string;
  readonly sentinelUsername?: string;
  readonly sentinelPassword?: string;
  readonly db?: number;
};

export type CacheRedisOptions = CacheRedisStandaloneOptions | CacheRedisSentinelOptions;

const createBaseRedisClientOptions = (overrides: RedisOptions = {}): RedisOptions => ({
  lazyConnect: true,
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
  ...overrides,
});

// Unset options keep ioredis defaults instead of overriding them with undefined.
const definedOnly = (options: RedisOptions): RedisOptions =>
  Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined));

const parseRedisUrl = (redisUrl: string): RedisOptions => {
  const url = new URL(redisUrl);
  if (url.protocol !== 'redis:' && url.protocol !== 'rediss:') {
    throw new Error(`Invalid Redis URL protocol: ${url.protocol}`);
  }

  const db = url.pathname.length > 1 ? Number(url.pathname.slice(1)) : undefined;
  const port = url.port ? Number(url.port) : undefined;

  if (db !== undefined && Number.isNaN(db)) {
    throw new Error(`Invalid Redis database in URL: ${redisUrl}`);
  }

  if (port !== undefined && Number.isNaN(port)) {
    throw new Error(`Invalid Redis port in URL: ${redisUrl}`);
  }

  return {
    host: url.hostname,
    port: port ?? 6379,
    username: url.username ? decodeURIComponent(url.username) : undefined,
    password: url.password ? decodeURIComponent(url.password) : undefined,
    db,
    tls: url.protocol === 'rediss:' ? {} : undefined,
  };
};

export const createCacheRedisClientOptions = (
  options: CacheRedisOptions,
  overrides: RedisOptions = {},
): RedisOptions => {
  const redisOptions = createBaseRedisClientOptions({
    keyPrefix: options.keyPrefix,
    ...definedOnly({
      connectTimeout: options.connectTimeoutMs,
      commandTimeout: options.commandTimeoutMs,
      enableOfflineQueue: options.enableOfflineQueue,
      maxRetriesPerRequest: options.maxRetriesPerRequest,
    }),
    ...overrides,
  });

  if (options.mode === 'standalone') {
    return {
      ...redisOptions,
      ...parseRedisUrl(options.url),
    };
  }

  return {
    ...redisOptions,
    name: options.masterName,
    sentinels: options.sentinels,
    username: options.username,
    password: options.password,
    sentinelUsername: options.sentinelUsername,
    sentinelPassword: options.sentinelPassword,
    db: options.db,
  };
};
