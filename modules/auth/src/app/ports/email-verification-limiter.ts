import type { Email } from '@repo/common';

export type IssuanceLimit =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
// Throws ServiceUnavailableException while the limits cannot be checked.
export abstract class EmailVerificationLimiter {
  abstract takeIssuance(email: Email): Promise<IssuanceLimit>;
  // Separate buckets: resets cannot use up verification codes, nor the other way round.
  abstract takePasswordResetIssuance(email: Email): Promise<IssuanceLimit>;
}
