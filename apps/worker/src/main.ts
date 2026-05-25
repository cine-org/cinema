import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';

async function bootstrap() {
  await NestFactory.createApplicationContext(AppModule);
}

bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
