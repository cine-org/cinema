import { NestFactory } from '@nestjs/core';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';
import { createOpenApiDocument } from './openapi-document';
import { splitBySurface } from './split-document';

// Build-time entry (`node dist/openapi/generate.js`): writes one schema per SDK (`admin.json`, `user.json`).
const OUTPUT_DIR = resolve(__dirname, '../../generated/openapi');

async function generate() {
  // Preview mode reads controller metadata without instantiating providers (no env, no DB).
  const app = await NestFactory.create(AppModule, { logger: false, preview: true });

  try {
    setupHttp(app);
    const documents = splitBySurface(createOpenApiDocument(app));

    await mkdir(OUTPUT_DIR, { recursive: true });

    for (const [surface, document] of Object.entries(documents)) {
      await writeFile(
        resolve(OUTPUT_DIR, `${surface}.json`),
        `${JSON.stringify(document, null, 2)}\n`,
      );
    }
  } finally {
    await app.close();
  }
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
