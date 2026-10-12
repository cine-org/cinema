import { Injectable, Logger } from '@nestjs/common';
import { CacheClient } from '@repo/cache';
import { PerInstanceTokenBuckets } from './per-instance-token-buckets';
import {
  assertValidBuckets,
  TAKE_TOKENS_SCRIPT,
  type Bucket,
  type TakeResult,
} from './token-bucket';

export type WhenRedisUnavailable =
  // Refuse: the caller turns this into a 503. For limits that must hold across instances.
  | 'reject'
  // Each API instance limits on its own (PerInstanceTokenBuckets): limits loosen by the instance
  // count but traffic keeps flowing. For limits that may loosen briefly.
  | 'per-instance';

export type TakeOptions = {
  readonly whenUnavailable: WhenRedisUnavailable;
};

export class RateLimiterUnavailableError extends Error {
  constructor(options?: ErrorOptions) {
    super('Rate limiter is unavailable', options);
    this.name = 'RateLimiterUnavailableError';
  }
}

// Consecutive Redis failures that open the circuit, and how long it stays open.
const FAILURES_TO_OPEN = 3;
const OPEN_FOR_MS = 10_000;

// Server replies that mean "Redis cannot serve this right now" rather than a bug on our side.
// OOM: memory is full and nothing could be evicted. BUSY: another script is stuck.
// The rest: failover/startup.
const UNAVAILABLE_REPLY_PREFIXES = [
  'OOM',
  'BUSY',
  'LOADING',
  'MASTERDOWN',
  'READONLY',
  'TRYAGAIN',
  'CLUSTERDOWN',
];

// The script answered, but not with what it should: a bug in the script or in this class.
class InvalidScriptReplyError extends Error {
  constructor(reply: unknown) {
    super(`Unexpected rate limit script reply: ${JSON.stringify(reply)}`);
    this.name = 'InvalidScriptReplyError';
  }
}

// Unavailable: no connection, timeouts, and the server replies above. Everything else (a script
// error, CROSSSLOT from keys in different cluster slots, a malformed reply) is a programming
// error: hiding it behind the fallback would keep limits silently wrong.
function isUnavailable(error: unknown): boolean {
  if (error instanceof InvalidScriptReplyError) return false;
  if (error instanceof Error && error.name === 'ReplyError') {
    return UNAVAILABLE_REPLY_PREFIXES.some((prefix) => error.message.startsWith(prefix));
  }
  return true;
}

// Token buckets in Redis. Keys of one take must share a hash slot when Redis runs as a cluster
// (use a hash tag such as `auth:ev:{<id>}:cooldown`).
@Injectable()
export class RateLimiter {
  private readonly logger = new Logger(RateLimiter.name);
  private readonly perInstance = new PerInstanceTokenBuckets();
  private consecutiveFailures = 0;
  private openUntil = 0;

  constructor(private readonly redis: CacheClient) {}

  async take(buckets: readonly Bucket[], options: TakeOptions): Promise<TakeResult> {
    assertValidBuckets(buckets);

    if (Date.now() < this.openUntil) return this.unavailable(buckets, options);

    try {
      const result = await this.takeFromRedis(buckets);
      this.consecutiveFailures = 0;
      return result;
    } catch (error) {
      if (!isUnavailable(error)) {
        this.logger.error('Rate limit script failed', error instanceof Error ? error.stack : error);
        throw error;
      }

      this.recordFailure(error);
      return this.unavailable(buckets, options, error);
    }
  }

  private async takeFromRedis(buckets: readonly Bucket[]): Promise<TakeResult> {
    // Fail fast instead of queueing while disconnected (the client also disables its offline queue).
    if (this.redis.status !== 'ready') throw new Error(`Redis is ${this.redis.status}`);

    const args = buckets.flatMap((bucket) => [bucket.capacity, bucket.refillIntervalMs]);
    const reply = await this.redis.eval(
      TAKE_TOKENS_SCRIPT,
      buckets.length,
      ...buckets.map((bucket) => bucket.key),
      ...args,
    );

    if (
      !Array.isArray(reply) ||
      reply.length !== 2 ||
      typeof reply[0] !== 'number' ||
      typeof reply[1] !== 'number'
    ) {
      throw new InvalidScriptReplyError(reply);
    }

    return { allowed: reply[0] === 1, retryAfterMs: reply[1] };
  }

  private recordFailure(error: unknown): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures < FAILURES_TO_OPEN) return;

    this.consecutiveFailures = 0;
    this.openUntil = Date.now() + OPEN_FOR_MS;
    const reason = error instanceof Error ? error.message : 'unknown error';
    this.logger.warn(`Redis unavailable (${reason}); skipping it for ${OPEN_FOR_MS} ms`);
  }

  private unavailable(
    buckets: readonly Bucket[],
    options: TakeOptions,
    cause?: unknown,
  ): TakeResult {
    if (options.whenUnavailable === 'per-instance') return this.perInstance.take(buckets);
    throw new RateLimiterUnavailableError({ cause });
  }
}
