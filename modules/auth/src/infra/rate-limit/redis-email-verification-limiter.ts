import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ServiceUnavailableException, type Email } from '@repo/common';
import { RateLimiter, RateLimiterUnavailableError, type Bucket } from '@repo/rate-limit';
import type { EmailVerificationLimiter, IssuanceLimit } from '../../app';
import { EMAIL_VERIFICATION_POLICY, PASSWORD_RESET_POLICY } from '../../domain';

const RETRY_WHEN_UNAVAILABLE_SECONDS = 10;

@Injectable()
export class RedisEmailVerificationLimiter implements EmailVerificationLimiter {
  constructor(private readonly limiter: RateLimiter) {}

  async takeIssuance(email: Email): Promise<IssuanceLimit> {
    return this.take(email, 'ev', EMAIL_VERIFICATION_POLICY);
  }

  async takePasswordResetIssuance(email: Email): Promise<IssuanceLimit> {
    return this.take(email, 'pr', PASSWORD_RESET_POLICY);
  }

  private async take(
    email: Email,
    flow: string,
    policy: { cooldown: Limit; issuance: Limit },
  ): Promise<IssuanceLimit> {
    try {
      const result = await this.limiter.take(
        [
          bucket(email, flow, 'cooldown', policy.cooldown),
          bucket(email, flow, 'issuance', policy.issuance),
        ],
        { whenUnavailable: 'reject' },
      );
      return result.allowed
        ? { allowed: true }
        : { allowed: false, retryAfterSeconds: Math.ceil(result.retryAfterMs / 1000) };
    } catch (error) {
      if (!(error instanceof RateLimiterUnavailableError)) throw error;
      throw new ServiceUnavailableException({
        message: 'Email code limits are unavailable',
        retryAfterSeconds: RETRY_WHEN_UNAVAILABLE_SECONDS,
        cause: error,
      });
    }
  }
}

type Limit = { capacity: number; refillIntervalMs: number };

// Hashed so Redis never holds the address. The {hash tag} keeps one email's keys in one cluster slot.
function bucket(email: Email, flow: string, kind: string, limit: Limit): Bucket {
  const hash = createHash('sha256').update(email.value).digest('hex');
  return { key: `auth:${flow}:{${hash}}:${kind}`, ...limit };
}
