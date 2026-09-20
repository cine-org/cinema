import { INestApplication, RequestMethod, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GlobalExceptionFilter } from '@/common/filters';
import { ConfigService } from '@/config';
import { setupSwagger } from '@/openapi';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const { app: appConfig } = configService;

  app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
  });

  app.setGlobalPrefix(appConfig.apiPrefix, {
    exclude: [
      {
        path: 'health',
        method: RequestMethod.ALL,
      },
      { path: 'health/live', method: RequestMethod.ALL },
      { path: 'health/ready', method: RequestMethod.ALL },
    ],
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalFilters(new GlobalExceptionFilter());
  app.enableShutdownHooks();

  setupSwagger(app, configService);

  await app.listen(appConfig.port);
}

bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
