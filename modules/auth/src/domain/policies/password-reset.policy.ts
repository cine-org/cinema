// Limits per email, apart from verification codes so one flow cannot starve the other. Per-IP
// limits belong to the api app.
export const PASSWORD_RESET_POLICY = {
  otpTtlSeconds: 600,
  maxFailedAttempts: 5,

  // Token buckets; sending a code takes from cooldown and issuance together.
  cooldown: { capacity: 1, refillIntervalMs: 60_000 },
  issuance: { capacity: 5, refillIntervalMs: 12 * 60_000 },
} as const;
