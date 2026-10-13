import type { RefreshToken } from '../../domain';

export type IssuedRefreshToken = {
  readonly refreshToken: RefreshToken;
  // Plain token for the cookie; never stored.
  readonly token: string;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class RefreshTokenProtector {
  abstract issue(input: { sessionId: string; now: Date }): IssuedRefreshToken;
  // Digest to look the token up by; null if it cannot be one of ours, so no query is needed.
  abstract digest(token: string): string | null;
}
