import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { createCacheRedisClientOptions, type CacheRedisOptions } from './cache-options';

export class CacheClient extends Redis implements OnModuleInit, OnModuleDestroy {
  constructor(options: CacheRedisOptions) {
    super(createCacheRedisClientOptions(options));
  }

  async onModuleInit() {
    if (this.status === 'wait') {
      await this.connect();
    }
  }

  async onModuleDestroy() {
    if (this.status !== 'end') {
      await this.quit();
    }
  }
}
