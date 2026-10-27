import { AUTH_SESSION_POLICY, type AuthSessionSurface } from '../policies';

export const AUTH_SESSION_REVOKED_REASONS = [
  'LOGOUT',
  'LOGOUT_ALL',
  'SESSION_DELETED',
  'SESSION_LIMIT',
  'REPLAY',
  'PASSWORD_RESET',
  'PASSWORD_CHANGED',
] as const;

export type AuthSessionRevokedReason = (typeof AUTH_SESSION_REVOKED_REASONS)[number];

export type RefreshTokenProps = {
  readonly id: string;
  readonly sessionId: string;
  // SHA-256 of the token; the token itself is never stored.
  readonly digest: string;
  readonly createdAt: Date;
  consumedAt: Date | null;
};

// One link of a session's rotation chain. Only AuthSession changes it.
export class RefreshToken {
  private constructor(private readonly props: RefreshTokenProps) {}

  static issue(input: { id: string; sessionId: string; digest: string; now: Date }): RefreshToken {
    return new RefreshToken({
      id: input.id,
      sessionId: input.sessionId,
      digest: input.digest,
      createdAt: input.now,
      consumedAt: null,
    });
  }

  static restore(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken({ ...props });
  }

  get isConsumed(): boolean {
    return this.props.consumedAt !== null;
  }

  consume(now: Date): void {
    this.props.consumedAt = now;
  }

  get id(): string {
    return this.props.id;
  }

  get sessionId(): string {
    return this.props.sessionId;
  }

  get digest(): string {
    return this.props.digest;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get consumedAt(): Date | null {
    return this.props.consumedAt;
  }
}

export type AuthSessionProps = {
  readonly id: string;
  readonly accountId: string;
  readonly surface: AuthSessionSurface;
  readonly createdAt: Date;
  lastRefreshedAt: Date;
  idleExpiresAt: Date;
  readonly absoluteExpiresAt: Date;
  revokedAt: Date | null;
  revokedReason: AuthSessionRevokedReason | null;
  // Shown in the session list only; never used to identify a device.
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
};

// Outcome of presenting a refresh token. Returned, not thrown, so the repository still saves what
// the outcome changed (a replay revokes the session).
export type RefreshOutcome = 'ROTATED' | 'REUSED_IN_GRACE' | 'REPLAY' | 'INACTIVE';

// One login. Its refresh tokens rotate on every refresh and expire with it.
export class AuthSession {
  private constructor(
    private readonly props: AuthSessionProps,
    // The token issued by the current change; the repository inserts it.
    private issued: RefreshToken | null = null,
  ) {}

  // The id is generated first because the first token belongs to it.
  static newId(): string {
    return crypto.randomUUID();
  }

  static start(input: {
    id: string;
    accountId: string;
    surface: AuthSessionSurface;
    refreshToken: RefreshToken;
    now: Date;
    userAgent: string | null;
    ipAddress: string | null;
  }): AuthSession {
    const lifetime = AUTH_SESSION_POLICY.lifetimes[input.surface];
    const absoluteExpiresAt = addSeconds(input.now, lifetime.absoluteTtlSeconds);
    return new AuthSession(
      {
        id: input.id,
        accountId: input.accountId,
        surface: input.surface,
        createdAt: input.now,
        lastRefreshedAt: input.now,
        idleExpiresAt: idleExpiry(input.now, lifetime.idleTtlSeconds, absoluteExpiresAt),
        absoluteExpiresAt,
        revokedAt: null,
        revokedReason: null,
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
      },
      input.refreshToken,
    );
  }

  static restore(props: AuthSessionProps): AuthSession {
    return new AuthSession({ ...props });
  }

  // Revokes the least recently refreshed of `active` so a new login stays within the limit.
  static makeRoomForLogin(active: readonly AuthSession[], now: Date): AuthSession[] {
    const excess = active.length - (AUTH_SESSION_POLICY.maxActiveSessionsPerAccount - 1);
    if (excess <= 0) return [];

    const evicted = [...active]
      .sort((a, b) => a.lastRefreshedAt.getTime() - b.lastRefreshedAt.getTime())
      .slice(0, excess);
    for (const session of evicted) session.revoke('SESSION_LIMIT', now);
    return evicted;
  }

  isActiveAt(now: Date): boolean {
    return (
      this.props.revokedAt === null &&
      now < this.props.idleExpiresAt &&
      now < this.props.absoluteExpiresAt
    );
  }

  // `presented` must belong to this session; `next` is used only when the outcome is ROTATED.
  refresh(presented: RefreshToken, next: RefreshToken, now: Date): RefreshOutcome {
    if (!this.isActiveAt(now)) return 'INACTIVE';

    if (presented.consumedAt) {
      const graceEnd = addSeconds(
        presented.consumedAt,
        AUTH_SESSION_POLICY.refreshReuseGraceSeconds,
      );
      if (now <= graceEnd) return 'REUSED_IN_GRACE';
      this.revoke('REPLAY', now);
      return 'REPLAY';
    }

    presented.consume(now);
    this.issued = next;
    this.props.lastRefreshedAt = now;
    this.props.idleExpiresAt = idleExpiry(
      now,
      AUTH_SESSION_POLICY.lifetimes[this.props.surface].idleTtlSeconds,
      this.props.absoluteExpiresAt,
    );
    return 'ROTATED';
  }

  // The first revocation wins: its reason is kept.
  revoke(reason: AuthSessionRevokedReason, now: Date): void {
    if (this.props.revokedAt) return;
    this.props.revokedAt = now;
    this.props.revokedReason = reason;
  }

  get issuedRefreshToken(): RefreshToken | null {
    return this.issued;
  }

  get id(): string {
    return this.props.id;
  }

  get accountId(): string {
    return this.props.accountId;
  }

  get surface(): AuthSessionSurface {
    return this.props.surface;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get lastRefreshedAt(): Date {
    return this.props.lastRefreshedAt;
  }

  get idleExpiresAt(): Date {
    return this.props.idleExpiresAt;
  }

  get absoluteExpiresAt(): Date {
    return this.props.absoluteExpiresAt;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get revokedReason(): AuthSessionRevokedReason | null {
    return this.props.revokedReason;
  }

  get userAgent(): string | null {
    return this.props.userAgent;
  }

  get ipAddress(): string | null {
    return this.props.ipAddress;
  }
}

function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

function idleExpiry(now: Date, idleTtlSeconds: number, absoluteExpiresAt: Date): Date {
  const idle = addSeconds(now, idleTtlSeconds);
  return idle < absoluteExpiresAt ? idle : absoluteExpiresAt;
}
