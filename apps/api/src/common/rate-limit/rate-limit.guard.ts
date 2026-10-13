import { createHash } from 'node:crypto';
import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TooManyRequestsException } from '@repo/common';
import { RateLimiter } from '@repo/rate-limit';
import type { Request } from 'express';
import { clientIpKey } from './client-ip';
import { RATE_LIMIT, type RateLimitOptions } from './rate-limit.options';

// Per-IP token bucket for routes marked with @RateLimit. While Redis is down each API instance
// limits on its own: limits loosen, requests keep flowing.
@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limiter: RateLimiter,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions | undefined>(RATE_LIMIT, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) return true;

    const ip = clientIpKey(context.switchToHttp().getRequest<Request>());
    const ipHash = createHash('sha256').update(ip).digest('hex');
    const result = await this.limiter.take(
      [
        {
          key: `http:rl:${options.key}:${ipHash}`,
          capacity: options.capacity,
          refillIntervalMs: options.refillIntervalMs,
        },
      ],
      { whenUnavailable: 'per-instance' },
    );

    if (!result.allowed) {
      throw new TooManyRequestsException({
        retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000),
      });
    }
    return true;
  }
}
