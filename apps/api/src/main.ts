import { Logger, type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { setupHttp, setupLogger, setupProxy, setupSwagger } from '@/bootstrap';
import { ConfigService } from '@/config';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule, {
    // Held until setupLogger applies LOG_LEVEL, then flushed.
    bufferLogs: true,
  });

  // Runs onModuleDestroy on SIGTERM/SIGINT so Redis and database connections close cleanly.
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const { app: appConfig } = configService;

  setupLogger(app, appConfig.logLevel);

  app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
  });

  setupHttp(app);
  setupProxy(app, appConfig.trustProxy);

  setupSwagger(app, configService);

  await app.listen(appConfig.apiPort);
}

bootstrap().catch((err) => {
  new Logger('Bootstrap').error(err);
  process.exit(1);
});
