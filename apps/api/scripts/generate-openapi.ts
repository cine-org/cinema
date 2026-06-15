import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const openApiJsonPath = resolve(process.cwd(), 'generated/openapi/schema.json');

async function main() {
  const { OpenApiModule, createOpenApiDocument } = await import('../src/openapi/index.js');

  const app = await NestFactory.create(OpenApiModule, {
    logger: false,
  });

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

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
