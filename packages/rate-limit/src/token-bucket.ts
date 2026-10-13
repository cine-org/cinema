// A bucket holds up to `capacity` tokens and regains one every `refillIntervalMs`.
// A new (or expired) bucket is full. Each take costs one token per bucket.
export type Bucket = {
  readonly key: string;
  readonly capacity: number;
  readonly refillIntervalMs: number;
};

export type TakeResult = {
  readonly allowed: boolean;
  // 0 when allowed; otherwise the wait until every bucket has a token again.
  readonly retryAfterMs: number;
};

export function assertValidBuckets(buckets: readonly Bucket[]): void {
  if (buckets.length === 0) throw new Error('At least one bucket is required');

  for (const bucket of buckets) {
    if (!bucket.key) throw new Error('Bucket key is required');
    if (!Number.isInteger(bucket.capacity) || bucket.capacity < 1) {
      throw new Error(`Bucket capacity must be a positive integer: ${bucket.key}`);
    }
    if (!Number.isFinite(bucket.refillIntervalMs) || bucket.refillIntervalMs <= 0) {
      throw new Error(`Bucket refill interval must be positive: ${bucket.key}`);
    }
  }
}

// All buckets or none: a take refused by one bucket leaves the others untouched.
// Time comes from the Redis server so API instances never disagree about refills.
// Each bucket is a hash {tokens, updatedAt} that expires once it would be full again.
//
// KEYS: bucket keys. ARGV: capacity1, refillIntervalMs1, capacity2, refillIntervalMs2, ...
// Returns {1, 0} when allowed, {0, retryAfterMs} when refused.
export const TAKE_TOKENS_SCRIPT = `
local time = redis.call('TIME')
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local state = {}
local wait = 0

for i, key in ipairs(KEYS) do
  local capacity = tonumber(ARGV[2 * i - 1])
  local interval = tonumber(ARGV[2 * i])
  local stored = redis.call('HMGET', key, 'tokens', 'updatedAt')
  local tokens = tonumber(stored[1]) or capacity
  local updatedAt = tonumber(stored[2]) or now
  tokens = math.min(capacity, tokens + math.max(0, now - updatedAt) / interval)
  if tokens < 1 then
    wait = math.max(wait, math.ceil((1 - tokens) * interval))
  end
  state[i] = { tokens, capacity, interval }
end

if wait > 0 then
  return { 0, wait }
end

for i, key in ipairs(KEYS) do
  local tokens = state[i][1] - 1
  local capacity = state[i][2]
  local interval = state[i][3]
  redis.call('HSET', key, 'tokens', tostring(tokens), 'updatedAt', now)
  redis.call('PEXPIRE', key, math.max(1, math.ceil((capacity - tokens) * interval)))
end

return { 1, 0 }
`;
