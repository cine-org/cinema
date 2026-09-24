import type { Env } from './env';
import { version } from '../../package.json';

export function createAppConfig(env: Env) {
  return Object.freeze({
    nodeEnv: env.NODE_ENV,
    apiPort: env.API_PORT,
    apiOrigin: env.API_ORIGIN ?? `http://localhost:${env.API_PORT}`,
    corsOrigins: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',').map((o) => o.trim()) : [],
    logLevel: env.LOG_LEVEL,
    enableSwagger: env.ENABLE_SWAGGER,
    version,
  });
}

export type AppConfig = ReturnType<typeof createAppConfig>;
