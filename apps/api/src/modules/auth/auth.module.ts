import { Module } from '@nestjs/common';
import { AuthModule as AuthDomainModule } from '@repo/auth';
import { RateLimitModule } from '@repo/rate-limit';
import { ConfigModule, ConfigService } from '@/config';
import { AdminAccessGuard } from './admin-access.guard';
import { AdminAuthController } from './admin-auth.controller';
import { TheaterLocator } from './theater-locator';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { AdminRefreshCookie, RefreshCookie } from './refresh-cookie';

@Module({
  imports: [
    AuthDomainModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.auth,
    }),
    // For @RateLimit on the controller.
    RateLimitModule,
  ],
  controllers: [AuthController, AdminAuthController],
  providers: [
    AuthService,
    BearerAuthGuard,
    RefreshCookie,
    AdminRefreshCookie,
    AdminAccessGuard,
    TheaterLocator,
  ],
  // A module using @BearerAuth imports this one: the guard needs AuthService.
  exports: [AuthService, BearerAuthGuard, AdminAccessGuard],
})
export class AuthModule {}
