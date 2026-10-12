import { Module } from '@nestjs/common';
import { RateLimiter } from './rate-limiter';

// Needs CacheClient in scope: import CacheModule.registerAsync in the app first (it is global).
@Module({
  providers: [RateLimiter],
  exports: [RateLimiter],
})
export class RateLimitModule {}
