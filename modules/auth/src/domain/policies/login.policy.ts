// Limits per email, on top of the api app's per-IP limit: guessing one account's password from many
// IPs still runs out. Every attempt counts, successful or not.
export const LOGIN_POLICY = {
  attempts: { capacity: 5, refillIntervalMs: 3 * 60_000 },
} as const;
