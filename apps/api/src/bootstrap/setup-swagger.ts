import { INestApplication } from '@nestjs/common';
import { SwaggerModule } from '@nestjs/swagger';
import type { ConfigService } from '@/config';
import { createOpenApiDocument } from '@/openapi';
import { API_PREFIX } from './setup-http';

export function setupSwagger(app: INestApplication, configService: ConfigService) {
  if (configService.isProduction) return;

  const { app: appConfig } = configService;
  if (!appConfig.enableSwagger) return;

  // Paths already carry the prefix, so the server is just the origin.
  const swaggerDocument = createOpenApiDocument(app, {
    version: appConfig.version,
    serverUrl: appConfig.apiOrigin,
    serverName: appConfig.nodeEnv,
  });

  SwaggerModule.setup(`${API_PREFIX}/docs`, app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'API Docs',
  });
}
