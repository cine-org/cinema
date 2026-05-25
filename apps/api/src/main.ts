import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { GlobalExceptionFilter } from '@/common/filters';
import { ConfigService } from '@/config';
import { setupApiRouting, setupSwagger } from '@/setup';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const app: INestApplication = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const { app: appConfig } = configService;

  app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
  });

  setupApiRouting({
    app,
    apiPrefix: appConfig.apiPrefix,
  });
  app.useGlobalFilters(new GlobalExceptionFilter());

  setupSwagger(app);

  await app.listen(appConfig.port);
}

bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
