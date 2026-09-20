import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from '@repo/auth';
import { DatabaseModule } from '@repo/database';
import { IamModule } from '@repo/iam';
import { UsersModule } from '@repo/users';
import { ConfigModule } from '@/config';
import { ConfigService } from '@/config';
import { AuthenticationGuard, AuthRateLimitGuard, PermissionGuard } from '@/common/auth';
import { AuthController, SelfUserController } from '@/auth.controller';
import { HealthController } from '@/health.controller';
import { IamController } from '@/iam.controller';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ url: config.db.url }),
    }),
    AuthModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.auth,
    }),
    UsersModule,
    IamModule,
  ],
  controllers: [HealthController, AuthController, SelfUserController, IamController],
  providers: [
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: AuthRateLimitGuard },
    { provide: APP_GUARD, useClass: PermissionGuard },
  ],
})
export class AppModule {}
