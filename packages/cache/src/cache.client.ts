import { Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { createCacheRedisClientOptions, type CacheRedisOptions } from './cache-options';

export class CacheClient extends Redis implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheClient.name);
  private readonly requireConnectionOnStartup: boolean;
  private lastErrorCode: string | null = null;

  constructor(options: CacheRedisOptions) {
    super(createCacheRedisClientOptions(options));
    this.requireConnectionOnStartup = options.requireConnectionOnStartup ?? true;

    // Without a listener ioredis prints every failed reconnect as an unhandled error event.
    // Log once per distinct failure, and again after the connection has recovered.
    this.on('error', (error: Error & { code?: string }) => {
      const code = error.code ?? error.name;
      if (code === this.lastErrorCode) return;
      this.lastErrorCode = code;
      this.logger.warn(`Redis connection error: ${code}`);
    });
    this.on('ready', () => {
      if (this.lastErrorCode) this.logger.log('Redis connection restored');
      this.lastErrorCode = null;
    });
  }

  async onModuleInit() {
    if (this.status !== 'wait') return;

    if (this.requireConnectionOnStartup) {
      await this.connect();
      return;
    }

    // ioredis keeps retrying after a failed first attempt; callers see status !== 'ready' meanwhile.
    this.connect().catch(() => undefined);
  }

  async onModuleDestroy() {
    if (this.status === 'end') return;

    try {
      if (this.status === 'ready') {
        await this.quit();
        return;
      }
    } catch {
      // Fall through to a hard disconnect.
    }

    this.disconnect();
  }
}
