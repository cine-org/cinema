import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { RequestMethod, VersioningType } from '@nestjs/common';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const openApiJsonPath = resolve(process.cwd(), 'generated/openapi/schema.json');

async function main() {
  const { OpenApiModule, createOpenApiDocument } = await import('../dist/openapi/index.js');
  const app = await NestFactory.create(OpenApiModule, {
    logger: false,
  });

  app.setGlobalPrefix(process.env.API_PREFIX || '/api', {
    exclude: [
      { path: 'health', method: RequestMethod.ALL },
      { path: 'health/live', method: RequestMethod.ALL },
      { path: 'health/ready', method: RequestMethod.ALL },
    ],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });

  try {
    const document = createOpenApiDocument(app);

    await mkdir(dirname(openApiJsonPath), {
      recursive: true,
    });
    await writeFile(openApiJsonPath, `${JSON.stringify(document, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
