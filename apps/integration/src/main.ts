import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const _app: INestApplication = await NestFactory.create(AppModule);
  // await app.listen(process.env.PORT ?? 3003);
}

bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
