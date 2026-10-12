import { Module, type MiddlewareConsumer, type NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { CacheModule } from '@repo/cache';
import { DatabaseModule } from '@repo/database';
import { GlobalExceptionFilter } from '@/common/filters';
import { requestIdMiddleware } from '@/common/middleware';
import { ResponseEnvelopeInterceptor } from '@/common/interceptors';
import { RequestValidationPipe } from '@/common/pipes';
import { ConfigModule, ConfigService } from '@/config';
import { HealthController } from '@/health.controller';
import { AuthModule } from '@/modules/auth';
import { TheatersModule } from '@/modules/theaters';
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
    // Holds rate limits only. Fails fast and never blocks startup: limiters decide what to do
    // while Redis is down (see @repo/rate-limit).
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        mode: 'standalone',
        url: config.cache.url,
        connectTimeoutMs: 5_000,
        commandTimeoutMs: 300,
        enableOfflineQueue: false,
        maxRetriesPerRequest: 0,
        requireConnectionOnStartup: false,
      }),
    }),
    AuthModule,
    TheatersModule,
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
