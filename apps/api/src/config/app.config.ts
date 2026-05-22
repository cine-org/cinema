import { env } from './env';
import { version } from '../../package.json';

const apiOrigin = env.API_ORIGIN ?? `http://localhost:${env.PORT}`;
const corsOrigins = env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map((o) => o.trim()) : [];

export const appConfig = Object.freeze({
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  apiOrigin,
  apiPrefix: env.API_PREFIX,
  apiBaseUrl: new URL(env.API_PREFIX, apiOrigin).toString(),
  corsOrigins,
  logLevel: env.LOG_LEVEL,
  enableSwagger: env.ENABLE_SWAGGER,
  version,
});

export type AppConfig = typeof appConfig;
