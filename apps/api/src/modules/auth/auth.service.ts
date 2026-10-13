import { Injectable } from '@nestjs/common';
import {
  AuthenticateHandler,
  AuthenticateQuery,
  ChangePasswordCommand,
  ChangePasswordHandler,
  ForgotPasswordCommand,
  ForgotPasswordHandler,
  ListSessionsHandler,
  ListSessionsQuery,
  LoginCommand,
  LoginHandler,
  LogoutAllCommand,
  LogoutAllHandler,
  LogoutCommand,
  LogoutHandler,
  RefreshCommand,
  RefreshHandler,
  RegisterCommand,
  RegisterHandler,
  ResendVerificationEmailCommand,
  ResendVerificationEmailHandler,
  ResetPasswordCommand,
  ResetPasswordHandler,
  RevokeSessionCommand,
  RevokeSessionHandler,
  VerifyEmailCommand,
  VerifyEmailHandler,
  type AccessTokenClaims,
  type ChangePasswordCommandProps,
  type LoginCommandProps,
  type PasswordResetAccepted,
  type RegisterCommandProps,
  type ResendVerificationEmailCommandProps,
  type ResetPasswordCommandProps,
  type SessionListItem,
  type SessionTokens,
  type VerificationAccepted,
  type VerifyEmailCommandProps,
} from '@repo/auth';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class AuthService {
  constructor(
    private readonly registerHandler: RegisterHandler,
    private readonly verifyEmailHandler: VerifyEmailHandler,
    private readonly resendHandler: ResendVerificationEmailHandler,
    private readonly loginHandler: LoginHandler,
    private readonly refreshHandler: RefreshHandler,
    private readonly logoutHandler: LogoutHandler,
    private readonly logoutAllHandler: LogoutAllHandler,
    private readonly revokeSessionHandler: RevokeSessionHandler,
    private readonly authenticateHandler: AuthenticateHandler,
    private readonly listSessionsHandler: ListSessionsHandler,
    private readonly forgotPasswordHandler: ForgotPasswordHandler,
    private readonly resetPasswordHandler: ResetPasswordHandler,
    private readonly changePasswordHandler: ChangePasswordHandler,
  ) {}

  async forgotPassword(email: string): Promise<PasswordResetAccepted> {
    return this.forgotPasswordHandler.execute(new ForgotPasswordCommand({ email }));
  }

  async resetPassword(props: ResetPasswordCommandProps): Promise<void> {
    await this.resetPasswordHandler.execute(new ResetPasswordCommand(props));
  }

  async changePassword(props: ChangePasswordCommandProps): Promise<void> {
    await this.changePasswordHandler.execute(new ChangePasswordCommand(props));
  }

  async register(props: RegisterCommandProps): Promise<VerificationAccepted> {
    return this.registerHandler.execute(new RegisterCommand(props));
  }

  async verifyEmail(props: VerifyEmailCommandProps): Promise<{ isEmailVerified: true }> {
    return this.verifyEmailHandler.execute(new VerifyEmailCommand(props));
  }

  async resendVerificationEmail(
    props: ResendVerificationEmailCommandProps,
  ): Promise<VerificationAccepted> {
    return this.resendHandler.execute(new ResendVerificationEmailCommand(props));
  }

  async login(props: LoginCommandProps): Promise<SessionTokens> {
    return this.loginHandler.execute(new LoginCommand(props));
  }

  async refresh(refreshToken: string | null): Promise<SessionTokens> {
    return this.refreshHandler.execute(new RefreshCommand({ refreshToken }));
  }

  async logout(refreshToken: string | null): Promise<void> {
    return this.logoutHandler.execute(new LogoutCommand({ refreshToken }));
  }

  async logoutAll(accountId: string): Promise<{ revokedSessions: number }> {
    return this.logoutAllHandler.execute(new LogoutAllCommand({ accountId }));
  }

  async revokeSession(accountId: string, sessionId: string): Promise<void> {
    return this.revokeSessionHandler.execute(new RevokeSessionCommand({ accountId, sessionId }));
  }

  async authenticate(accessToken: string): Promise<AccessTokenClaims> {
    return this.authenticateHandler.execute(new AuthenticateQuery({ accessToken }));
  }

  async listSessions(auth: AccessTokenClaims): Promise<SessionListItem[]> {
    return this.listSessionsHandler.execute(
      new ListSessionsQuery({ accountId: auth.accountId, currentSessionId: auth.sessionId }),
    );
  }
}
