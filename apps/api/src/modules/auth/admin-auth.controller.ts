import { Body, Delete, Get, Param, ParseUUIDPipe, Post, Req, Res } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import {
  InvalidRefreshTokenException,
  SessionEndedException,
  type AccessTokenClaims,
  type AuthenticatedAccount,
  type SessionTokens,
} from '@repo/auth';
import type { Request, Response } from 'express';
import { IdResponseDto } from '@/common/dto';
import { TrustedOrigin } from '@/common/origin';
import { RateLimit } from '@/common/rate-limit';
import { ApiSuccess } from '@/common/responses';
import { AdminApi, AnyInternalRole, PublicAdminRoute } from '@/common/surface';
import { AuthService } from './auth.service';
import { CurrentAuth } from './bearer-auth.decorator';
import { clientInfo } from './client-info';
import {
  AdminAccessTokenResponseDto,
  AdminLoginRequestDto,
  AdminLogoutAllResponseDto,
  AdminLogoutResponseDto,
  AdminMeResponseDto,
  AdminSessionResponseDto,
} from './dto';
import { AdminRefreshCookie } from './refresh-cookie';

// Sign-in for internal accounts. Customers cannot sign in here, and tokens from here are only
// accepted by the admin API.
// Its own sessions: any internal role. Signing in, refreshing and logging out: no session needed.
@ApiTags('admin-auth')
@AdminApi('auth')
@AnyInternalRole()
export class AdminAuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: AdminRefreshCookie,
  ) {}

  @Post('login')
  @PublicAdminRoute()
  @TrustedOrigin()
  @RateLimit({ key: 'admin-auth:login', capacity: 10, refillIntervalMs: 6_000 })
  @ApiSuccess(AdminAccessTokenResponseDto, {
    description: 'Signed in; the refresh token is set as an HttpOnly cookie.',
  })
  async login(
    @Body() body: AdminLoginRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminAccessTokenResponseDto> {
    const tokens = await this.auth.login({
      email: body.email,
      password: body.password,
      surface: 'ADMIN',
      ...clientInfo(request),
    });
    return this.issue(response, tokens);
  }

  @Post('refresh')
  @PublicAdminRoute()
  @TrustedOrigin()
  @RateLimit({ key: 'admin-auth:refresh', capacity: 30, refillIntervalMs: 2_000 })
  @ApiCookieAuth('admin_refresh_token')
  @ApiSuccess(AdminAccessTokenResponseDto, {
    description: 'New access token; the cookie now holds a new refresh token.',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminAccessTokenResponseDto> {
    try {
      return this.issue(response, await this.auth.refresh(this.cookie.read(request), 'ADMIN'));
    } catch (error) {
      // This cookie can never refresh again. A reused token keeps the cookie: it already holds
      // the new token.
      if (error instanceof InvalidRefreshTokenException || error instanceof SessionEndedException) {
        this.cookie.clear(response);
      }
      throw error;
    }
  }

  @Post('logout')
  @PublicAdminRoute()
  @TrustedOrigin()
  @RateLimit({ key: 'admin-auth:logout', capacity: 30, refillIntervalMs: 2_000 })
  @ApiCookieAuth('admin_refresh_token')
  @ApiSuccess(AdminLogoutResponseDto, {
    description: 'Session of the cookie revoked, if any; the cookie is cleared either way.',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminLogoutResponseDto> {
    await this.auth.logout(this.cookie.read(request));
    this.cookie.clear(response);
    return { loggedOut: true };
  }

  @Post('logout-all')
  @ApiSuccess(AdminLogoutAllResponseDto, {
    description: 'Every session of the account revoked, this one included; cookie cleared.',
  })
  async logoutAll(
    @CurrentAuth() auth: AccessTokenClaims,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AdminLogoutAllResponseDto> {
    const result = await this.auth.logoutAll(auth.accountId);
    this.cookie.clear(response);
    return result;
  }

  @Get('me')
  @ApiSuccess(AdminMeResponseDto, {
    description: 'The signed-in account: its role, where it applies and its permissions.',
  })
  async me(@CurrentAuth() auth: AuthenticatedAccount): Promise<AdminMeResponseDto> {
    return AdminMeResponseDto.from(await this.auth.profile(auth.accountId), auth.role);
  }

  @Get('sessions')
  @ApiSuccess([AdminSessionResponseDto], {
    description: 'Active sessions of the account, most recently refreshed first.',
  })
  async listSessions(@CurrentAuth() auth: AccessTokenClaims): Promise<AdminSessionResponseDto[]> {
    const sessions = await this.auth.listSessions(auth);
    return sessions.map((session) => ({
      id: session.id,
      createdAt: session.createdAt.toISOString(),
      lastRefreshedAt: session.lastRefreshedAt.toISOString(),
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      isCurrent: session.isCurrent,
    }));
  }

  @Delete('sessions/:id')
  @ApiSuccess(IdResponseDto, {
    description: 'Session revoked. Revoking the current one ends this access token too.',
  })
  async revokeSession(
    @CurrentAuth() auth: AccessTokenClaims,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<IdResponseDto> {
    await this.auth.revokeSession(auth.accountId, id);
    return { id };
  }

  private issue(response: Response, tokens: SessionTokens): AdminAccessTokenResponseDto {
    this.cookie.set(response, tokens.refreshToken, tokens.refreshTokenExpiresAt);
    return {
      accessToken: tokens.accessToken,
      tokenType: 'Bearer',
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
    };
  }
}
