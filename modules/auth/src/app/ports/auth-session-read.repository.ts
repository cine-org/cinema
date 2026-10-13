export type ActiveSessionView = {
  readonly id: string;
  readonly createdAt: Date;
  readonly lastRefreshedAt: Date;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class AuthSessionReadRepository {
  // Most recently refreshed first.
  abstract listActive(accountId: string, now: Date): Promise<ActiveSessionView[]>;
}
