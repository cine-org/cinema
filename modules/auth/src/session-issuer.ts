import { Inject, Injectable } from '@nestjs/common';
import { AuthMethod, DatabaseClient } from '@repo/database';
import { AUTH_OPTIONS } from './auth.constants';
import type { AuthModuleOptions, AuthTokens, RequestContext } from './auth.types';
import { TokenService } from './token.service';

@Injectable()
export class SessionIssuer {
  constructor(
    private readonly db: DatabaseClient,
    private readonly tokens: TokenService,
    @Inject(AUTH_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  async issue(
    userId: string,
    identityId: string | undefined,
    authMethod: AuthMethod,
    context: RequestContext = {},
  ): Promise<AuthTokens> {
    const refreshToken = this.tokens.randomToken();
    const expiresAt = new Date(Date.now() + this.options.sessionTtlSeconds * 1000);
    const session = await this.db.authSession.create({
      data: {
        userId,
        createdByIdentityId: identityId,
        authMethod,
        expiresAt,
        deviceId: context.deviceId,
        deviceName: context.deviceName,
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        refreshTokens: { create: { tokenHash: this.tokens.hash(refreshToken), expiresAt } },
      },
    });
    const access = await this.tokens.signAccessToken(userId, session.id);
    return {
      accessToken: access.token,
      accessTokenExpiresIn: this.options.accessTokenTtlSeconds,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
    };
  }
}
