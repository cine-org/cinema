import {
  DynamicModule,
  Global,
  Module,
  type FactoryProvider,
  type ModuleMetadata,
} from '@nestjs/common';
import { CacheClient } from './cache.client';
import { CACHE_REDIS_OPTIONS } from './cache.constants';
import type { CacheRedisOptions } from './cache-options';

export type CacheModuleAsyncOptions<TArgs extends unknown[] = unknown[]> = {
  readonly imports?: ModuleMetadata['imports'];
  readonly inject?: FactoryProvider['inject'];
  readonly useFactory: (...args: TArgs) => CacheRedisOptions | Promise<CacheRedisOptions>;
};

@Global()
@Module({})
export class CacheModule {
  static registerAsync<TArgs extends unknown[] = unknown[]>(
    options: CacheModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    return {
      module: CacheModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: CACHE_REDIS_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        {
          provide: CacheClient,
          inject: [CACHE_REDIS_OPTIONS],
          useFactory: (redisOptions: CacheRedisOptions) => new CacheClient(redisOptions),
        },
      ],
      exports: [CacheClient],
    };
  }
}
