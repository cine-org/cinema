import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { AuthService, type RequestContext } from '@repo/auth';
import { PERMISSION_CODE, type AuthPrincipal } from '@repo/contracts';
import { ConfigService } from '@/config';
import {
  GetUserByIdHandler,
  GetUserByIdQuery,
  UpdateUserProfileCommand,
  UpdateUserProfileHandler,
} from '@repo/users';
import {
  CurrentUser,
  Public,
  RateLimit,
  RequirePermissions,
  type AuthenticatedRequest,
} from '@/common/auth';
import type { Response } from 'express';

class RegisterBody {
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ minLength: 3, maxLength: 32 }) username!: string;
  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true }) password!: string;
  @ApiPropertyOptional() fullName?: string;
}
class LoginBody {
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ writeOnly: true }) password!: string;
  @ApiPropertyOptional() deviceName?: string;
  @ApiPropertyOptional() deviceId?: string;
}
class TokenBody {
  @ApiProperty({ writeOnly: true }) token!: string;
}
class EmailBody {
  @ApiProperty({ format: 'email' }) email!: string;
}
class ResetBody {
  @ApiProperty({ writeOnly: true }) token!: string;
  @ApiProperty({ minLength: 12, maxLength: 128, writeOnly: true }) password!: string;
}
class ProfileBody {
  @ApiPropertyOptional({ nullable: true }) fullName?: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'uri' }) avatarUrl?: string | null;
  @ApiPropertyOptional({ nullable: true, format: 'date' }) dateOfBirth?: string | null;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('register')
  async register(@Body() body: RegisterBody, @Req() request: AuthenticatedRequest) {
    const email = this.required(body.email, 'email');
    const username = this.required(body.username, 'username');
    const password = this.required(body.password, 'password');
    if (!email.includes('@')) throw new BadRequestException('Invalid email');
    await this.auth.register(
      { email, username, password, fullName: body.fullName },
      this.context(request),
    );
    return { message: 'Verification email queued' };
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.NO_CONTENT)
  async verifyEmail(@Body() body: TokenBody) {
    await this.auth.verifyEmail(this.required(body.token, 'token'));
  }

  @Public()
  @Post('resend-verification')
  @RateLimit(3, 300)
  @HttpCode(HttpStatus.ACCEPTED)
  async resend(@Body() body: EmailBody) {
    await this.auth.resendVerification(this.required(body.email, 'email'));
  }

  @Public()
  @Post('login')
  @RateLimit(10, 60)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginBody,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.auth.login(
      this.required(body.email, 'email'),
      this.required(body.password, 'password'),
      this.context(request, body),
    );
    this.setRefreshCookie(response, result.refreshToken, result.refreshTokenExpiresAt);
    return this.publicLoginResult(result);
  }

  @Public()
  @Post('refresh')
  @RateLimit(30, 60)
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Headers('origin') origin: string | undefined,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertOrigin(origin);
    const raw = this.cookie(request, this.config.auth.refreshCookieName);
    if (!raw) throw new BadRequestException('Refresh token cookie is required');
    const result = await this.auth.refresh(raw, this.context(request));
    this.setRefreshCookie(response, result.refreshToken, result.refreshTokenExpiresAt);
    return this.publicLoginResult(result);
  }

  @ApiBearerAuth('bearer')
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @CurrentUser() principal: AuthPrincipal,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logout(principal.userId, principal.sessionId, this.context(request));
    this.clearRefreshCookie(response);
  }

  @ApiBearerAuth('bearer')
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logoutAll(
    @CurrentUser() principal: AuthPrincipal,
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: Response,
  ) {
    await this.auth.logoutAll(principal.userId, this.context(request));
    this.clearRefreshCookie(response);
  }

  @Public()
  @Post('forgot-password')
  @RateLimit(3, 300)
  @HttpCode(HttpStatus.ACCEPTED)
  async forgot(@Body() body: EmailBody) {
    await this.auth.forgotPassword(this.required(body.email, 'email'));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async reset(@Body() body: ResetBody) {
    await this.auth.resetPassword(
      this.required(body.token, 'token'),
      this.required(body.password, 'password'),
    );
  }

  @ApiBearerAuth('bearer')
  @Get('me')
  @RequirePermissions(PERMISSION_CODE.User.ReadOwn)
  me(@Req() request: AuthenticatedRequest) {
    return request.authUser;
  }

  @ApiBearerAuth('bearer')
  @Get('sessions')
  sessions(@CurrentUser() principal: AuthPrincipal) {
    return this.auth.listSessions(principal.userId, principal.sessionId);
  }

  @ApiBearerAuth('bearer')
  @Delete('sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(
    @CurrentUser() principal: AuthPrincipal,
    @Param('sessionId') sessionId: string,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.auth.revokeSession(principal.userId, sessionId, this.context(request));
  }

  private context(
    request: AuthenticatedRequest,
    body: Pick<LoginBody, 'deviceId' | 'deviceName'> = {},
  ): RequestContext {
    return {
      ipAddress: request.ip,
      userAgent: request.headers['user-agent'],
      deviceId: body.deviceId,
      deviceName: body.deviceName,
    };
  }
  private required(value: string | undefined, field: string): string {
    if (!value?.trim()) throw new BadRequestException(`${field} is required`);
    return value;
  }
  private cookie(request: AuthenticatedRequest, name: string): string | undefined {
    return request.headers.cookie
      ?.split(';')
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1);
  }
  private setRefreshCookie(response: Response, token: string, expires: Date) {
    response.cookie(this.config.auth.refreshCookieName, token, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      expires,
      path: `${this.config.app.apiPrefix}/v1/auth`,
    });
  }
  private clearRefreshCookie(response: Response) {
    response.clearCookie(this.config.auth.refreshCookieName, {
      httpOnly: true,
      secure: this.config.isProduction,
      sameSite: 'strict',
      path: `${this.config.app.apiPrefix}/v1/auth`,
    });
  }
  private assertOrigin(origin?: string) {
    if (!origin || origin !== this.config.auth.webOrigin)
      throw new BadRequestException('Invalid origin');
  }
  private publicLoginResult<
    T extends { accessToken: string; accessTokenExpiresIn: number; user: unknown },
  >(result: T) {
    return {
      accessToken: result.accessToken,
      expiresIn: result.accessTokenExpiresIn,
      user: result.user,
    };
  }
}

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
export class SelfUserController {
  constructor(
    private readonly updateProfile: UpdateUserProfileHandler,
    private readonly getUser: GetUserByIdHandler,
  ) {}

  @Patch('me')
  @RequirePermissions(PERMISSION_CODE.User.UpdateOwn)
  async update(@CurrentUser() principal: AuthPrincipal, @Body() body: ProfileBody) {
    await this.updateProfile.execute(
      new UpdateUserProfileCommand({
        userId: principal.userId,
        fullName: body.fullName,
        avatarUrl: body.avatarUrl,
        dateOfBirth: this.date(body.dateOfBirth),
      }),
    );
    const user = await this.getUser.execute(new GetUserByIdQuery(principal.userId));
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      dateOfBirth: user.dateOfBirth,
      status: user.status.value,
    };
  }

  private date(value: string | null | undefined): Date | null | undefined {
    if (value === null || value === undefined) return value;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf()))
      throw new BadRequestException('dateOfBirth must be an ISO date');
    return parsed;
  }
}
