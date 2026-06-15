import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { ConfigService } from '@/config';
import { createOpenApiDocument } from './openapi-document';

export function setupSwagger(app: INestApplication, configService: ConfigService) {
  if (configService.isProduction) return;

  const { app: appConfig } = configService;
  if (!appConfig.enableSwagger) return;

  const swaggerDocument = createOpenApiDocument(app, {
    version: appConfig.version,
    serverUrl: appConfig.apiBaseUrl,
    serverName: appConfig.nodeEnv,
  });

  SwaggerModule.setup(`${appConfig.apiPrefix}/docs`, app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'API Docs',
  });
}
