export const RATE_LIMIT = Symbol('RATE_LIMIT');

export type RateLimitOptions = {
  // Names the limit; routes sharing a key share one bucket per IP.
  readonly key: string;
  // Requests allowed in a burst.
  readonly capacity: number;
  // One more request allowed every interval.
  readonly refillIntervalMs: number;
};
