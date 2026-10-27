import {
  Module,
  type DynamicModule,
  type FactoryProvider,
  type ModuleMetadata,
} from '@nestjs/common';
import { RateLimitModule } from '@repo/rate-limit';
import {
  AccessTokenIssuer,
  AccountReadRepository,
  AccountWriteRepository,
  AuthenticateHandler,
  AuthMailer,
  AuthSessionReadRepository,
  AuthSessionWriteRepository,
  ChangePasswordHandler,
  EmailOtpProtector,
  EmailVerificationLimiter,
  ForgotPasswordHandler,
  GetAccountProfileHandler,
  ListSessionsHandler,
  LoginHandler,
  LoginLimiter,
  LogoutAllHandler,
  LogoutHandler,
  PasswordHasher,
  RefreshHandler,
  RefreshTokenProtector,
  RegisterHandler,
  ResendVerificationEmailHandler,
  ResetPasswordHandler,
  RevokeSessionHandler,
  VerifyEmailHandler,
} from './app';
import {
  Argon2PasswordHasher,
  HmacEmailOtpProtector,
  JoseAccessTokenIssuer,
  PrismaAccountReadRepository,
  PrismaAccountWriteRepository,
  PrismaAuthSessionReadRepository,
  PrismaAuthSessionWriteRepository,
  RedisEmailVerificationLimiter,
  RedisLoginLimiter,
  Sha256RefreshTokenProtector,
  SmtpAuthMailer,
  type SmtpOptions,
} from './infra';

export type AuthModuleOptions = {
  // Base64 of at least 32 random bytes; changing it invalidates every pending code.
  readonly otpHmacKey: string;
  // Base64 of at least 32 random bytes; changing it signs every user out within the access
  // token lifetime.
  readonly jwtSecret: string;
  readonly smtp: SmtpOptions;
};

export type AuthModuleAsyncOptions<TArgs extends unknown[] = unknown[]> = {
  readonly imports?: ModuleMetadata['imports'];
  readonly inject?: FactoryProvider['inject'];
  readonly useFactory: (...args: TArgs) => AuthModuleOptions | Promise<AuthModuleOptions>;
};

const AUTH_MODULE_OPTIONS = Symbol('AUTH_MODULE_OPTIONS');

const handlers = [
  RegisterHandler,
  VerifyEmailHandler,
  ResendVerificationEmailHandler,
  LoginHandler,
  RefreshHandler,
  LogoutHandler,
  LogoutAllHandler,
  RevokeSessionHandler,
  AuthenticateHandler,
  GetAccountProfileHandler,
  ListSessionsHandler,
  ForgotPasswordHandler,
  ResetPasswordHandler,
  ChangePasswordHandler,
];

// Needs DatabaseModule and CacheModule registered by the app.
@Module({})
export class AuthModule {
  static registerAsync<TArgs extends unknown[] = unknown[]>(
    options: AuthModuleAsyncOptions<TArgs>,
  ): DynamicModule {
    return {
      module: AuthModule,
      imports: [...(options.imports ?? []), RateLimitModule],
      providers: [
        {
          provide: AUTH_MODULE_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        { provide: AccountReadRepository, useClass: PrismaAccountReadRepository },
        { provide: AccountWriteRepository, useClass: PrismaAccountWriteRepository },
        { provide: AuthSessionReadRepository, useClass: PrismaAuthSessionReadRepository },
        { provide: AuthSessionWriteRepository, useClass: PrismaAuthSessionWriteRepository },
        { provide: PasswordHasher, useClass: Argon2PasswordHasher },
        { provide: RefreshTokenProtector, useClass: Sha256RefreshTokenProtector },
        { provide: EmailVerificationLimiter, useClass: RedisEmailVerificationLimiter },
        { provide: LoginLimiter, useClass: RedisLoginLimiter },
        {
          provide: EmailOtpProtector,
          inject: [AUTH_MODULE_OPTIONS],
          useFactory: (config: AuthModuleOptions) => new HmacEmailOtpProtector(config.otpHmacKey),
        },
        {
          provide: AccessTokenIssuer,
          inject: [AUTH_MODULE_OPTIONS],
          useFactory: (config: AuthModuleOptions) => new JoseAccessTokenIssuer(config.jwtSecret),
        },
        {
          provide: AuthMailer,
          inject: [AUTH_MODULE_OPTIONS],
          useFactory: (config: AuthModuleOptions) => new SmtpAuthMailer(config.smtp),
        },
        ...handlers,
      ],
      exports: [...handlers],
    };
  }
}
