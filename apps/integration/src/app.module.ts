import { Module } from '@nestjs/common';
import { DatabaseModule } from '@repo/database';
import nodemailer from 'nodemailer';
import { config } from '@/config';
import { MAIL_TRANSPORT, OutboxEmailService } from '@/outbox-email.service';

@Module({
  imports: [DatabaseModule.registerAsync({ useFactory: () => ({ url: config.DATABASE_URL }) })],
  providers: [
    {
      provide: MAIL_TRANSPORT,
      useFactory: () =>
        nodemailer.createTransport({
          host: config.SMTP_HOST,
          port: config.SMTP_PORT,
          secure: config.SMTP_SECURE,
          auth: config.SMTP_USER
            ? { user: config.SMTP_USER, pass: config.SMTP_PASSWORD }
            : undefined,
        }),
    },
    OutboxEmailService,
  ],
})
export class AppModule {}
