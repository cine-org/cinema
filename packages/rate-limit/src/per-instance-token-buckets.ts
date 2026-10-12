import type { Bucket, TakeResult } from './token-bucket';

type State = { tokens: number; updatedAt: number; fullAt: number };

const MAX_ENTRIES = 10_000;
const SWEEP_INTERVAL_MS = 1_000;

// Same algorithm as the Redis script, kept in this process only. Used as a fallback while Redis
// is unavailable: each API instance then limits on its own, so limits loosen by the instance count.
export class PerInstanceTokenBuckets {
  private readonly buckets = new Map<string, State>();
  private lastSweepAt = 0;

  take(buckets: readonly Bucket[], now = Date.now()): TakeResult {
    this.evictFull(now);

    const refilled = buckets.map((bucket) => {
      const state = this.buckets.get(bucket.key);
      const tokens = state
        ? Math.min(
            bucket.capacity,
            state.tokens + Math.max(0, now - state.updatedAt) / bucket.refillIntervalMs,
          )
        : bucket.capacity;
      return { bucket, tokens };
    });

    const wait = Math.max(
      0,
      ...refilled.map(({ bucket, tokens }) =>
        tokens < 1 ? Math.ceil((1 - tokens) * bucket.refillIntervalMs) : 0,
      ),
    );
    if (wait > 0) return { allowed: false, retryAfterMs: wait };

    for (const { bucket, tokens } of refilled) {
      const left = tokens - 1;
      this.buckets.delete(bucket.key); // re-insert so Map order tracks recency
      this.buckets.set(bucket.key, {
        tokens: left,
        updatedAt: now,
        fullAt: now + (bucket.capacity - left) * bucket.refillIntervalMs,
      });
    }

    return { allowed: true, retryAfterMs: 0 };
  }

  // A full bucket behaves like a missing one, so dropping it loses nothing.
  private evictFull(now: number): void {
    if (now - this.lastSweepAt >= SWEEP_INTERVAL_MS) {
      this.lastSweepAt = now;
      for (const [key, state] of this.buckets) {
        if (state.fullAt <= now) this.buckets.delete(key);
      }
    }

    // Bound memory under a flood of distinct keys: drop the least recently used.
    while (this.buckets.size >= MAX_ENTRIES) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }
}
