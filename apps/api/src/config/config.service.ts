import { Injectable } from '@nestjs/common';
import { type AppConfig, appConfig } from './app.config';
import { type DbConfig, dbConfig } from './db.config';
import { type AuthConfig, authConfig } from './auth.config';

@Injectable()
export class ConfigService {
  readonly app: AppConfig = appConfig;
  readonly db: DbConfig = dbConfig;
  readonly auth: AuthConfig = authConfig;

  get isProduction() {
    return this.app.nodeEnv === 'production';
  }

  get isDevelopment() {
    return this.app.nodeEnv === 'development';
  }
}
