import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';
import { createOpenApiDocument } from './openapi-document';

// Build-time entry (`node dist/openapi/generate.js`): writes the schema api-client is generated from.
const OUTPUT_PATH = resolve(__dirname, '../../generated/openapi/schema.json');

async function generate() {
  // Preview mode reads controller metadata without instantiating providers (no env, no DB).
  const app = await NestFactory.create(AppModule, { logger: false, preview: true });

  try {
    setupHttp(app);
    const document = createOpenApiDocument(app);

    await mkdir(dirname(OUTPUT_PATH), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(document, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
