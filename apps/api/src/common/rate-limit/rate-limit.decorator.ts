import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorResponse } from '@/common/responses';
import { RateLimitGuard } from './rate-limit.guard';
import { RATE_LIMIT, type RateLimitOptions } from './rate-limit.options';

// Limits a route (or every route of a controller) per client IP. The module declaring the
// controller must import RateLimitModule from @repo/rate-limit.
export function RateLimit(options: RateLimitOptions) {
  return applyDecorators(
    SetMetadata(RATE_LIMIT, options),
    UseGuards(RateLimitGuard),
    ApiResponse({
      status: 429,
      type: ErrorResponse,
      description: 'Too many requests; see the Retry-After header.',
    }),
  );
}
