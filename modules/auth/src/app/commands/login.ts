import { Injectable } from '@nestjs/common';
import { Email, TooManyRequestsException } from '@repo/common';
import { AuthSession, EmailNotVerifiedException, InvalidCredentialsException } from '../../domain';
import {
  AccessTokenIssuer,
  AccountWriteRepository,
  AuthSessionWriteRepository,
  LoginLimiter,
  PasswordHasher,
  RefreshTokenProtector,
} from '../ports';
import type { SessionTokens } from './session-tokens';

export type LoginCommandProps = {
  readonly email: string;
  readonly password: string;
  readonly userAgent: string | null;
  readonly ipAddress: string | null;
};

export class LoginCommand {
  constructor(readonly props: LoginCommandProps) {}
}

@Injectable()
export class LoginHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly sessions: AuthSessionWriteRepository,
    private readonly hasher: PasswordHasher,
    private readonly limiter: LoginLimiter,
    private readonly refreshTokens: RefreshTokenProtector,
    private readonly accessTokens: AccessTokenIssuer,
  ) {}

  async execute(command: LoginCommand): Promise<SessionTokens> {
    const { password, userAgent, ipAddress } = command.props;
    const email = Email.create(command.props.email);

    // Before the hash, so the limit also caps the Argon2 work spent on one email.
    const limit = await this.limiter.takeAttempt(email);
    if (!limit.allowed) {
      throw new TooManyRequestsException({ retryAfterSeconds: limit.retryAfterSeconds });
    }

    const credentials = await this.accounts.findLoginCredentials(email);
    const matches = await this.hasher.verify(credentials?.passwordHash ?? null, password);
    if (!credentials || !matches) throw new InvalidCredentialsException();
    if (!credentials.isEmailVerified) throw new EmailNotVerifiedException();

    const now = new Date();
    const sessionId = AuthSession.newId();
    const issued = this.refreshTokens.issue({ sessionId, now });
    const session = await this.sessions.start(
      credentials.id,
      credentials.passwordHash,
      now,
      (active) => {
        AuthSession.makeRoomForLogin(active, now);
        return AuthSession.start({
          id: sessionId,
          accountId: credentials.id,
          refreshToken: issued.refreshToken,
          now,
          userAgent,
          ipAddress,
        });
      },
    );
    // Deleted, or the password reset or changed, since the credentials were read.
    if (!session) throw new InvalidCredentialsException();

    const access = await this.accessTokens.issue({
      accountId: session.accountId,
      sessionId: session.id,
      now,
    });
    return {
      accessToken: access.token,
      accessTokenExpiresAt: access.expiresAt,
      refreshToken: issued.token,
      refreshTokenExpiresAt: session.idleExpiresAt,
    };
  }
}
