import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { Email } from '@repo/common';
import { RateLimiter } from '@repo/rate-limit';
import type { LoginAttemptLimit, LoginLimiter } from '../../app';
import { LOGIN_POLICY } from '../../domain';

@Injectable()
export class RedisLoginLimiter implements LoginLimiter {
  constructor(private readonly limiter: RateLimiter) {}

  // Per instance while Redis is down: the limit loosens by the instance count, but login keeps
  // working.
  async takeAttempt(email: Email): Promise<LoginAttemptLimit> {
    const hash = createHash('sha256').update(email.value).digest('hex');
    const result = await this.limiter.take(
      [{ key: `auth:login:{${hash}}:attempts`, ...LOGIN_POLICY.attempts }],
      { whenUnavailable: 'per-instance' },
    );
    return result.allowed
      ? { allowed: true }
      : { allowed: false, retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000) };
  }
}
