import { Injectable } from '@nestjs/common';
import { type AppConfig, appConfig } from './app.config';
import { type DbConfig, dbConfig } from './db.config';

@Injectable()
export class ConfigService {
  readonly app: AppConfig = appConfig;
  readonly db: DbConfig = dbConfig;

  get isProduction() {
    return this.app.nodeEnv === 'production';
  }

  get isDevelopment() {
    return this.app.nodeEnv === 'development';
  }
}
