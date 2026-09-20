export const AUTH_METHOD = {
  PASSWORD: 'PASSWORD',
  OAUTH: 'OAUTH',
} as const;

export type AuthMethod = (typeof AUTH_METHOD)[keyof typeof AUTH_METHOD];

export type AuthPrincipal = {
  readonly userId: string;
  readonly sessionId: string;
  readonly tokenId: string;
};

export type AccessTokenClaims = {
  readonly sub: string;
  readonly sid: string;
  readonly jti: string;
  readonly iss: string;
  readonly aud: string;
  readonly iat: number;
  readonly exp: number;
};

export type AuthSessionSummary = {
  readonly id: string;
  readonly deviceName?: string | null;
  readonly userAgent?: string | null;
  readonly ipAddress?: string | null;
  readonly lastUsedAt: string;
  readonly expiresAt: string;
  readonly current: boolean;
};
