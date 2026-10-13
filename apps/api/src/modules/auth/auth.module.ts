import { Module } from '@nestjs/common';
import { AuthModule as AuthDomainModule } from '@repo/auth';
import { RateLimitModule } from '@repo/rate-limit';
import { ConfigModule, ConfigService } from '@/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BearerAuthGuard } from './bearer-auth.guard';
import { RefreshCookie } from './refresh-cookie';

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
  controllers: [AuthController],
  providers: [AuthService, BearerAuthGuard, RefreshCookie],
  // A module using @BearerAuth imports this one: the guard needs AuthService.
  exports: [AuthService, BearerAuthGuard],
})
export class AuthModule {}
