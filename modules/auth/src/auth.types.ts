import type { AuthPrincipal, AuthSessionSummary } from '@repo/contracts';

export type AuthModuleOptions = {
  readonly jwtPrivateKey: string;
  readonly jwtPublicKey: string;
  readonly jwtIssuer: string;
  readonly jwtAudience: string;
  readonly accessTokenTtlSeconds: number;
  readonly sessionTtlSeconds: number;
  readonly verificationTtlSeconds: number;
  readonly resetTtlSeconds: number;
  readonly outboxEncryptionKey: string;
  readonly webOrigin: string;
};

export type RequestContext = {
  readonly ipAddress?: string;
  readonly userAgent?: string;
  readonly deviceId?: string;
  readonly deviceName?: string;
};

export type AuthTokens = {
  readonly accessToken: string;
  readonly accessTokenExpiresIn: number;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
};

export type AuthenticatedUser = {
  readonly id: string;
  readonly username: string;
  readonly email: string;
  readonly fullName?: string | null;
  readonly avatarUrl?: string | null;
  readonly status: string;
};

export type LoginResult = AuthTokens & { readonly user: AuthenticatedUser };
export type PrincipalResult = {
  readonly principal: AuthPrincipal;
  readonly user: AuthenticatedUser;
};
export type SessionResult = AuthSessionSummary;
