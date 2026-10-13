import type { Email } from '@repo/common';

export type LoginAttemptLimit =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class LoginLimiter {
  abstract takeAttempt(email: Email): Promise<LoginAttemptLimit>;
}
