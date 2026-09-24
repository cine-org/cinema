import type { INestApplication, LogLevel } from '@nestjs/common';

// Most to least verbose; LOG_LEVEL keeps its level and everything more severe.
const LOG_LEVELS: LogLevel[] = ['verbose', 'debug', 'log', 'warn', 'error', 'fatal'];

export function setupLogger(app: INestApplication, level: LogLevel): void {
  app.useLogger(LOG_LEVELS.slice(LOG_LEVELS.indexOf(level)));
}
