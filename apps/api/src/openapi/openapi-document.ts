import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export type OpenApiDocumentOptions = {
  readonly title?: string;
  readonly description?: string;
  readonly version?: string;
  readonly serverUrl?: string;
  readonly serverName?: string;
};

export function createOpenApiConfig({
  title = 'API Documentation',
  description = 'API docs for cinema-api',
  version = '0.0.0',
  serverUrl,
  serverName,
}: OpenApiDocumentOptions = {}) {
  const builder = new DocumentBuilder()
    .setTitle(title)
    .setDescription(description)
    .setVersion(version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      'bearer',
    );

  if (serverUrl) {
    builder.addServer(serverUrl, serverName);
  }

  return builder.build();
}

export function createOpenApiDocument(app: INestApplication, options: OpenApiDocumentOptions = {}) {
  const document = SwaggerModule.createDocument(app, createOpenApiConfig(options));

  if (!options.serverUrl) {
    delete document.servers;
  }

  return document;
}
