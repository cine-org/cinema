import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const openApiJsonPath = resolve(process.cwd(), 'generated/openapi/schema.json');

async function main() {
  process.env.DATABASE_URL ||= 'postgresql://postgres:postgres@localhost:5432/cinema';

  const { AppModule } = await import('../src/app.module.js');
  const { createOpenApiDocument } = await import('../src/setup/index.js');

  const app = await NestFactory.create(AppModule, {
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
