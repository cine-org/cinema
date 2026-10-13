import {
  Body,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import {
  InvalidRefreshTokenException,
  SessionEndedException,
  type AccessTokenClaims,
  type SessionTokens,
} from '@repo/auth';
import type { Request, Response } from 'express';
import { IdResponseDto } from '@/common/dto';
import { TrustedOrigin } from '@/common/origin';
import { RateLimit } from '@/common/rate-limit';
import { ApiSuccess } from '@/common/responses';
import { UserApi } from '@/common/surface';
import { BearerAuth, CurrentAuth } from './bearer-auth.decorator';
import {
  AccessTokenResponseDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  LogoutAllResponseDto,
  LogoutResponseDto,
  PasswordResetAcceptedResponseDto,
  PasswordUpdatedResponseDto,
  RegisterRequestDto,
  ResendVerificationEmailRequestDto,
  ResetPasswordRequestDto,
  SessionResponseDto,
  VerificationAcceptedResponseDto,
  VerifyEmailRequestDto,
  VerifyEmailResponseDto,
} from './dto';
import { AuthService } from './auth.service';
import { RefreshCookie } from './refresh-cookie';

// Stored for the session list only; capped so a huge header cannot bloat the row.
const MAX_USER_AGENT_LENGTH = 512;

@ApiTags('auth')
@UserApi('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly cookie: RefreshCookie,
  ) {}

  @Post('register')
  @RateLimit({ key: 'auth:register', capacity: 10, refillIntervalMs: 60_000 })
  @ApiSuccess(VerificationAcceptedResponseDto, {
    status: HttpStatus.ACCEPTED,
    description: 'Registration accepted; the verification code is emailed asynchronously.',
  })
  async register(@Body() body: RegisterRequestDto): Promise<VerificationAcceptedResponseDto> {
    return this.auth.register(body);
  }

  @Post('verify-email')
  @RateLimit({ key: 'auth:verify-email', capacity: 30, refillIntervalMs: 2_000 })
  @ApiSuccess(VerifyEmailResponseDto, { description: 'Email verified; no session is created.' })
  async verifyEmail(@Body() body: VerifyEmailRequestDto): Promise<VerifyEmailResponseDto> {
    return this.auth.verifyEmail(body);
  }

  @Post('resend-verification-email')
  @RateLimit({ key: 'auth:resend-verification-email', capacity: 30, refillIntervalMs: 2_000 })
  @ApiSuccess(VerificationAcceptedResponseDto, {
    status: HttpStatus.ACCEPTED,
    description: 'Accepted; a new code is emailed if the given one can be renewed.',
  })
  async resendVerificationEmail(
    @Body() body: ResendVerificationEmailRequestDto,
  ): Promise<VerificationAcceptedResponseDto> {
    return this.auth.resendVerificationEmail(body);
  }

  @Post('login')
  @TrustedOrigin()
  @RateLimit({ key: 'auth:login', capacity: 10, refillIntervalMs: 6_000 })
  @ApiSuccess(AccessTokenResponseDto, {
    description: 'Logged in; the refresh token is set as an HttpOnly cookie.',
  })
  async login(
    @Body() body: LoginRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
    const tokens = await this.auth.login({
      email: body.email,
      password: body.password,
      userAgent: request.headers['user-agent']?.slice(0, MAX_USER_AGENT_LENGTH) ?? null,
      ipAddress: request.ip ?? null,
    });
    return this.issue(response, tokens);
  }

  @Post('refresh')
  @TrustedOrigin()
  @RateLimit({ key: 'auth:refresh', capacity: 30, refillIntervalMs: 2_000 })
  @ApiCookieAuth('refresh_token')
  @ApiSuccess(AccessTokenResponseDto, {
    description: 'New access token; the cookie now holds a new refresh token.',
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenResponseDto> {
    try {
      return this.issue(response, await this.auth.refresh(this.cookie.read(request)));
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
  @TrustedOrigin()
  @RateLimit({ key: 'auth:logout', capacity: 30, refillIntervalMs: 2_000 })
  @ApiCookieAuth('refresh_token')
  @ApiSuccess(LogoutResponseDto, {
    description: 'Session of the cookie revoked, if any; the cookie is cleared either way.',
  })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutResponseDto> {
    await this.auth.logout(this.cookie.read(request));
    this.cookie.clear(response);
    return { loggedOut: true };
  }

  @Post('logout-all')
  @BearerAuth()
  @ApiSuccess(LogoutAllResponseDto, {
    description: 'Every session of the account revoked, this one included; cookie cleared.',
  })
  async logoutAll(
    @CurrentAuth() auth: AccessTokenClaims,
    @Res({ passthrough: true }) response: Response,
  ): Promise<LogoutAllResponseDto> {
    const result = await this.auth.logoutAll(auth.accountId);
    this.cookie.clear(response);
    return result;
  }

  @Get('sessions')
  @BearerAuth()
  @ApiSuccess([SessionResponseDto], {
    description: 'Active sessions of the account, most recently refreshed first.',
  })
  async listSessions(@CurrentAuth() auth: AccessTokenClaims): Promise<SessionResponseDto[]> {
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
  @BearerAuth()
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

  @Post('forgot-password')
  @RateLimit({ key: 'auth:forgot-password', capacity: 10, refillIntervalMs: 60_000 })
  @ApiSuccess(PasswordResetAcceptedResponseDto, {
    status: HttpStatus.ACCEPTED,
    description:
      'Accepted; if the email has an account, a reset code is emailed. Same answer otherwise.',
  })
  async forgotPassword(
    @Body() body: ForgotPasswordRequestDto,
  ): Promise<PasswordResetAcceptedResponseDto> {
    return this.auth.forgotPassword(body.email);
  }

  @Post('reset-password')
  @RateLimit({ key: 'auth:reset-password', capacity: 30, refillIntervalMs: 2_000 })
  @ApiSuccess(PasswordUpdatedResponseDto, {
    description:
      'Password reset and email marked verified; every session ended. Log in with the new password.',
  })
  async resetPassword(@Body() body: ResetPasswordRequestDto): Promise<PasswordUpdatedResponseDto> {
    await this.auth.resetPassword(body);
    return { passwordUpdated: true };
  }

  @Post('change-password')
  @BearerAuth()
  @ApiSuccess(PasswordUpdatedResponseDto, {
    description: 'Password changed; every session ended, this one too. Cookie cleared.',
  })
  async changePassword(
    @CurrentAuth() auth: AccessTokenClaims,
    @Body() body: ChangePasswordRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<PasswordUpdatedResponseDto> {
    await this.auth.changePassword({ accountId: auth.accountId, ...body });
    this.cookie.clear(response);
    return { passwordUpdated: true };
  }

  private issue(response: Response, tokens: SessionTokens): AccessTokenResponseDto {
    this.cookie.set(response, tokens.refreshToken, tokens.refreshTokenExpiresAt);
    return {
      accessToken: tokens.accessToken,
      tokenType: 'Bearer',
      accessTokenExpiresAt: tokens.accessTokenExpiresAt.toISOString(),
    };
  }
}
