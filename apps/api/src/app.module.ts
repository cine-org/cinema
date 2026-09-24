import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { DatabaseModule } from '@repo/database';
import { GlobalExceptionFilter } from '@/common/filters';
import { requestIdMiddleware } from '@/common/middleware';
import { ResponseEnvelopeInterceptor } from '@/common/interceptors';
import { RequestValidationPipe } from '@/common/pipes';
import { ConfigModule, ConfigService } from '@/config';
import { HealthController } from '@/health.controller';
import { AuthModule } from '@/modules/auth';
import { UsersModule } from '@/modules/users';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        url: config.db.url,
        readUrl: config.db.readUrl,
      }),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_PIPE, useClass: RequestValidationPipe },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(requestIdMiddleware).forRoutes('*path');
  }
}
