import { Inject, Injectable } from '@nestjs/common';
import {
  Prisma,
  UserStatus,
  IdentityType,
  AuthMethod,
  AuthChallengeType,
  DatabaseClient,
} from '@repo/database';
import { SYSTEM_ROLE_CODE, type AuthPrincipal } from '@repo/contracts';
import { AUTH_OPTIONS } from './auth.constants';
import { AuthError, RegistrationConflict } from './auth.exception';
import type {
  AuthenticatedUser,
  AuthModuleOptions,
  LoginResult,
  PrincipalResult,
  RequestContext,
  SessionResult,
} from './auth.types';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import { SessionIssuer } from './session-issuer';

type Db = DatabaseClient | Prisma.TransactionClient;

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseClient,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly sessionIssuer: SessionIssuer,
    @Inject(AUTH_OPTIONS) private readonly options: AuthModuleOptions,
  ) {}

  async register(
    input: { email: string; username: string; password: string; fullName?: string },
    context: RequestContext = {},
  ): Promise<void> {
    const email = this.normalizeEmail(input.email);
    const normalizedUsername = this.normalizeUsername(input.username);
    this.passwords.assertValid(input.password);
    const passwordHash = await this.passwords.hash(input.password);
    const rawChallenge = this.tokens.randomToken();
    const expiresAt = this.after(this.options.verificationTtlSeconds);

    try {
      await this.db.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            username: input.username.trim(),
            normalizedUsername,
            fullName: input.fullName?.trim() || null,
            status: UserStatus.PENDING_VERIFICATION,
            identities: {
              create: {
                type: IdentityType.EMAIL,
                identifier: input.email.trim(),
                normalizedIdentifier: email,
              },
            },
            passwordCredential: { create: { passwordHash } },
          },
          include: { identities: true },
        });
        await tx.authChallenge.create({
          data: {
            userId: user.id,
            type: AuthChallengeType.VERIFY_EMAIL,
            tokenHash: this.tokens.hash(rawChallenge),
            expiresAt,
          },
        });
        const customer = await tx.role.findUniqueOrThrow({
          where: { code: SYSTEM_ROLE_CODE.CUSTOMER },
          select: { id: true },
        });
        await tx.userRole.create({ data: { userId: user.id, roleId: customer.id } });
        await this.enqueue(tx, 'auth.verify_email', {
          email,
          username: user.username,
          token: rawChallenge,
          expiresAt: expiresAt.toISOString(),
        });
        await this.audit(tx, 'auth.register', 'SUCCESS', context, undefined, user.id);
      });
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(',')
          : String(error.meta?.target ?? '');
        if (target.includes('username')) throw RegistrationConflict.username();
        throw RegistrationConflict.email();
      }
      throw error;
    }
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const result = await this.db.$transaction(async (tx) => {
      const challenge = await tx.authChallenge.findUnique({
        where: { tokenHash: this.tokens.hash(rawToken) },
        include: { user: { select: { status: true } } },
      });
      if (!challenge || challenge.type !== AuthChallengeType.VERIFY_EMAIL || challenge.consumedAt)
        return 'invalid' as const;
      if (challenge.expiresAt <= new Date()) return 'expired' as const;
      if (challenge.user.status !== UserStatus.PENDING_VERIFICATION) return 'invalid' as const;
      const now = new Date();
      const consumed = await tx.authChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return 'invalid' as const;
      await tx.userIdentity.updateMany({
        where: { userId: challenge.userId, type: IdentityType.EMAIL },
        data: { verifiedAt: now },
      });
      await tx.user.update({
        where: { id: challenge.userId },
        data: { status: UserStatus.ACTIVE, statusChangedAt: now },
      });
      await this.audit(
        tx,
        'auth.email_verified',
        'SUCCESS',
        {},
        challenge.userId,
        challenge.userId,
      );
      return 'ok' as const;
    });
    if (result === 'expired') throw AuthError.challengeExpired();
    if (result === 'invalid') throw AuthError.challengeInvalid();
  }

  async resendVerification(emailInput: string): Promise<void> {
    const email = this.normalizeEmail(emailInput);
    const identity = await this.db.userIdentity.findUnique({
      where: {
        type_normalizedIdentifier: { type: IdentityType.EMAIL, normalizedIdentifier: email },
      },
      include: { user: true },
    });
    if (
      !identity ||
      identity.verifiedAt ||
      identity.user.status !== UserStatus.PENDING_VERIFICATION
    )
      return;
    const token = this.tokens.randomToken();
    const expiresAt = this.after(this.options.verificationTtlSeconds);
    await this.db.$transaction(async (tx) => {
      await tx.authChallenge.updateMany({
        where: { userId: identity.userId, type: AuthChallengeType.VERIFY_EMAIL, consumedAt: null },
        data: { consumedAt: new Date() },
      });
      await tx.authChallenge.create({
        data: {
          userId: identity.userId,
          type: AuthChallengeType.VERIFY_EMAIL,
          tokenHash: this.tokens.hash(token),
          expiresAt,
        },
      });
      await this.enqueue(tx, 'auth.verify_email', {
        email,
        username: identity.user.username,
        token,
        expiresAt: expiresAt.toISOString(),
      });
    });
  }

  async login(
    emailInput: string,
    password: string,
    context: RequestContext = {},
  ): Promise<LoginResult> {
    const email = this.normalizeEmail(emailInput);
    const identity = await this.db.userIdentity.findUnique({
      where: {
        type_normalizedIdentifier: { type: IdentityType.EMAIL, normalizedIdentifier: email },
      },
      include: { user: { include: { passwordCredential: true } } },
    });
    if (!identity?.user.passwordCredential) {
      await this.passwords.burn(password);
      await this.audit(this.db, 'auth.login', 'DENIED', context);
      throw AuthError.invalidCredentials();
    }
    if (!(await this.passwords.verify(identity.user.passwordCredential.passwordHash, password))) {
      await this.audit(this.db, 'auth.login', 'DENIED', context, identity.userId, identity.userId);
      throw AuthError.invalidCredentials();
    }
    if (!identity.verifiedAt || identity.user.status === UserStatus.PENDING_VERIFICATION) {
      await this.audit(this.db, 'auth.login', 'DENIED', context, identity.userId, identity.userId);
      throw AuthError.emailNotVerified();
    }
    if (identity.user.status !== UserStatus.ACTIVE || identity.user.deletedAt) {
      await this.audit(this.db, 'auth.login', 'DENIED', context, identity.userId, identity.userId);
      throw AuthError.accountInactive();
    }
    const tokens = await this.sessionIssuer.issue(
      identity.userId,
      identity.id,
      AuthMethod.PASSWORD,
      context,
    );
    await this.audit(this.db, 'auth.login', 'SUCCESS', context, identity.userId, identity.userId);
    return { ...tokens, user: this.toUser(identity.user, identity.identifier) };
  }

  async refresh(rawToken: string, context: RequestContext = {}): Promise<LoginResult> {
    const replacement = this.tokens.randomToken();
    const replacementHash = this.tokens.hash(replacement);
    const rotate = () =>
      this.db.$transaction(
        async (tx) => {
          const current = await tx.refreshToken.findUnique({
            where: { tokenHash: this.tokens.hash(rawToken) },
            include: { session: { include: { user: { include: { identities: true } } } } },
          });
          if (!current) return { kind: 'invalid' as const };
          const now = new Date();
          if (current.rotatedAt || current.replacedByTokenId || current.revokedAt) {
            await tx.refreshToken.update({
              where: { id: current.id },
              data: { reuseDetectedAt: now },
            });
            await tx.authSession.update({
              where: { id: current.sessionId },
              data: { revokedAt: now },
            });
            await this.audit(
              tx,
              'auth.refresh_reuse',
              'DENIED',
              context,
              current.session.userId,
              current.session.userId,
              current.sessionId,
            );
            return { kind: 'reused' as const };
          }
          if (
            current.expiresAt <= now ||
            current.session.expiresAt <= now ||
            current.session.revokedAt
          )
            return { kind: 'invalid' as const };
          if (current.session.user.status !== UserStatus.ACTIVE || current.session.user.deletedAt)
            return { kind: 'inactive' as const };
          const next = await tx.refreshToken.create({
            data: {
              sessionId: current.sessionId,
              tokenHash: replacementHash,
              expiresAt: current.session.expiresAt,
            },
          });
          await tx.refreshToken.update({
            where: { id: current.id },
            data: { rotatedAt: now, replacedByTokenId: next.id },
          });
          await tx.authSession.update({
            where: { id: current.sessionId },
            data: { lastUsedAt: now },
          });
          return { kind: 'ok' as const, session: current.session };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

    // PostgreSQL intentionally aborts one of two concurrent serializable refreshes.
    // Retrying makes the loser observe the token as already rotated, which triggers
    // reuse detection and revokes the session family instead of leaking a P2034/500.
    let result: Awaited<ReturnType<typeof rotate>> | undefined;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        result = await rotate();
        break;
      } catch (error) {
        const serializationConflict =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034';
        if (!serializationConflict || attempt === 2) throw error;
      }
    }
    if (!result) throw AuthError.invalidToken();

    if (result.kind === 'reused') throw AuthError.refreshReused();
    if (result.kind === 'inactive') throw AuthError.accountInactive();
    if (result.kind !== 'ok') {
      await this.audit(this.db, 'auth.refresh', 'DENIED', context);
      throw AuthError.invalidToken();
    }
    const signed = await this.tokens.signAccessToken(result.session.userId, result.session.id);
    const email =
      result.session.user.identities.find((item) => item.type === IdentityType.EMAIL)?.identifier ??
      '';
    return {
      accessToken: signed.token,
      accessTokenExpiresIn: this.options.accessTokenTtlSeconds,
      refreshToken: replacement,
      refreshTokenExpiresAt: result.session.expiresAt,
      user: this.toUser(result.session.user, email),
    };
  }

  async authenticate(accessToken: string): Promise<PrincipalResult> {
    const claims = await this.tokens.verifyAccessToken(accessToken);
    const session = await this.db.authSession.findUnique({
      where: { id: claims.sid },
      include: { user: { include: { identities: true } } },
    });
    if (!session || session.userId !== claims.sub) throw AuthError.sessionNotFound();
    if (session.revokedAt || session.expiresAt <= new Date()) throw AuthError.sessionRevoked();
    if (session.user.status !== UserStatus.ACTIVE || session.user.deletedAt)
      throw AuthError.accountInactive();
    const principal: AuthPrincipal = {
      userId: claims.sub,
      sessionId: claims.sid,
      tokenId: claims.jti,
    };
    const email =
      session.user.identities.find((item) => item.type === IdentityType.EMAIL)?.identifier ?? '';
    return { principal, user: this.toUser(session.user, email) };
  }

  async logout(userId: string, sessionId: string, context: RequestContext = {}): Promise<void> {
    const now = new Date();
    await this.db.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { id: sessionId, userId },
        data: { revokedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { sessionId, session: { userId } },
        data: { revokedAt: now },
      });
      await this.audit(tx, 'auth.logout', 'SUCCESS', context, userId, userId, sessionId);
    });
  }

  async logoutAll(userId: string, context: RequestContext = {}): Promise<void> {
    const sessions = await this.db.authSession.findMany({
      where: { userId, revokedAt: null },
      select: { id: true },
    });
    const now = new Date();
    await this.db.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { sessionId: { in: sessions.map((item) => item.id) }, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.audit(tx, 'auth.logout_all', 'SUCCESS', context, userId, userId);
    });
  }

  async listSessions(userId: string, currentSessionId: string): Promise<SessionResult[]> {
    const rows = await this.db.authSession.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
    });
    return rows.map((row) => ({
      id: row.id,
      deviceName: row.deviceName,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      lastUsedAt: row.lastUsedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      current: row.id === currentSessionId,
    }));
  }

  async revokeSession(
    userId: string,
    sessionId: string,
    context: RequestContext = {},
  ): Promise<void> {
    const now = new Date();
    await this.db.$transaction(async (tx) => {
      await tx.authSession.updateMany({
        where: { id: sessionId, userId },
        data: { revokedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { sessionId, session: { userId } },
        data: { revokedAt: now },
      });
      await this.audit(tx, 'auth.session_revoked', 'SUCCESS', context, userId, userId, sessionId);
    });
  }

  async forgotPassword(emailInput: string): Promise<void> {
    const email = this.normalizeEmail(emailInput);
    const identity = await this.db.userIdentity.findUnique({
      where: {
        type_normalizedIdentifier: { type: IdentityType.EMAIL, normalizedIdentifier: email },
      },
      include: { user: true },
    });
    if (!identity || identity.user.deletedAt) {
      await this.audit(this.db, 'auth.password_reset_requested', 'DENIED', {});
      return;
    }
    const token = this.tokens.randomToken();
    const expiresAt = this.after(this.options.resetTtlSeconds);
    await this.db.$transaction(async (tx) => {
      await tx.authChallenge.updateMany({
        where: {
          userId: identity.userId,
          type: AuthChallengeType.RESET_PASSWORD,
          consumedAt: null,
        },
        data: { consumedAt: new Date() },
      });
      await tx.authChallenge.create({
        data: {
          userId: identity.userId,
          type: AuthChallengeType.RESET_PASSWORD,
          tokenHash: this.tokens.hash(token),
          expiresAt,
        },
      });
      await this.enqueue(tx, 'auth.reset_password', {
        email,
        username: identity.user.username,
        token,
        expiresAt: expiresAt.toISOString(),
      });
      await this.audit(
        tx,
        'auth.password_reset_requested',
        'SUCCESS',
        {},
        identity.userId,
        identity.userId,
      );
    });
  }

  async resetPassword(rawToken: string, password: string): Promise<void> {
    this.passwords.assertValid(password);
    const passwordHash = await this.passwords.hash(password);
    const result = await this.db.$transaction(async (tx) => {
      const challenge = await tx.authChallenge.findUnique({
        where: { tokenHash: this.tokens.hash(rawToken) },
      });
      if (!challenge || challenge.type !== AuthChallengeType.RESET_PASSWORD || challenge.consumedAt)
        return 'invalid' as const;
      if (challenge.expiresAt <= new Date()) return 'expired' as const;
      const now = new Date();
      const consumed = await tx.authChallenge.updateMany({
        where: { id: challenge.id, consumedAt: null },
        data: { consumedAt: now },
      });
      if (consumed.count !== 1) return 'invalid' as const;
      await tx.passwordCredential.upsert({
        where: { userId: challenge.userId },
        create: { userId: challenge.userId, passwordHash, passwordChangedAt: now },
        update: { passwordHash, passwordChangedAt: now },
      });
      await tx.refreshToken.updateMany({
        where: { session: { userId: challenge.userId }, revokedAt: null },
        data: { revokedAt: now },
      });
      await tx.authSession.updateMany({
        where: { userId: challenge.userId, revokedAt: null },
        data: { revokedAt: now },
      });
      await this.audit(
        tx,
        'auth.password_reset',
        'SUCCESS',
        {},
        challenge.userId,
        challenge.userId,
      );
      return 'ok' as const;
    });
    if (result === 'expired') {
      await this.audit(this.db, 'auth.password_reset', 'DENIED', {});
      throw AuthError.challengeExpired();
    }
    if (result === 'invalid') {
      await this.audit(this.db, 'auth.password_reset', 'DENIED', {});
      throw AuthError.challengeInvalid();
    }
  }

  private toUser(
    user: {
      id: string;
      username: string;
      fullName: string | null;
      avatarUrl: string | null;
      status: string;
    },
    email: string,
  ): AuthenticatedUser {
    return {
      id: user.id,
      username: user.username,
      email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      status: user.status,
    };
  }

  private async enqueue(db: Db, topic: string, payload: unknown): Promise<void> {
    await db.outboxMessage.create({
      data: { topic, encryptedPayload: this.tokens.encryptOutbox(payload) },
    });
  }

  private async audit(
    db: Db,
    action: string,
    outcome: string,
    context: RequestContext,
    actorUserId?: string,
    targetUserId?: string,
    sessionId?: string,
  ): Promise<void> {
    await db.securityAuditEvent.create({
      data: {
        action,
        outcome,
        actorUserId,
        targetUserId,
        sessionId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    });
  }

  private normalizeEmail(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (normalized.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      throw AuthError.invalid('Invalid email');
    return normalized;
  }
  private normalizeUsername(value: string): string {
    const normalized = value.trim().toLowerCase();
    if (!/^[a-z0-9_.-]{3,32}$/.test(normalized))
      throw AuthError.invalid(
        'Username must be 3-32 letters, numbers, dots, underscores or dashes',
      );
    return normalized;
  }
  private after(seconds: number): Date {
    return new Date(Date.now() + seconds * 1000);
  }
  private isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
