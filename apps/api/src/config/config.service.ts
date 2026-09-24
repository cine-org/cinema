import { Injectable } from '@nestjs/common';
import { type AppConfig, createAppConfig } from './app.config';
import { type DbConfig, createDbConfig } from './db.config';
import { loadEnv } from './env';

@Injectable()
export class ConfigService {
  readonly app: AppConfig;
  readonly db: DbConfig;

  constructor() {
    const env = loadEnv();
    this.app = createAppConfig(env);
    this.db = createDbConfig(env);
  }

  get isProduction() {
    return this.app.nodeEnv === 'production';
  }
}
