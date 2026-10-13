import { Injectable } from '@nestjs/common';
import { type AppConfig, createAppConfig } from './app.config';
import { type AuthConfig, createAuthConfig } from './auth.config';
import { type CacheConfig, createCacheConfig } from './cache.config';
import { type DbConfig, createDbConfig } from './db.config';
import { loadEnv } from './env';

@Injectable()
export class ConfigService {
  readonly app: AppConfig;
  readonly db: DbConfig;
  readonly cache: CacheConfig;
  readonly auth: AuthConfig;

  constructor() {
    const env = loadEnv();
    this.app = createAppConfig(env);
    this.db = createDbConfig(env);
    this.cache = createCacheConfig(env);
    this.auth = createAuthConfig(env);
  }

  get isProduction() {
    return this.app.nodeEnv === 'production';
  }
}
