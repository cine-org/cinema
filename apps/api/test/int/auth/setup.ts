import { Test, type TestingModule } from '@nestjs/testing';
import {
  AccountWriteRepository,
  AuthModule,
  AuthSession,
  AuthSessionWriteRepository,
  RefreshTokenProtector,
  type AuthSessionSurface,
} from '@repo/auth';
import { CacheModule } from '@repo/cache';
import { DatabaseModule, DatabaseWriteClient } from '@repo/database';
import { ConfigModule, ConfigService } from '@/config';

// Real auth repositories against the test database, without the HTTP layer; every account created
// here is removed in close(), with its sessions, tokens and codes (cascade).
export async function setupAuth() {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule,
      DatabaseModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({ url: config.db.url }),
      }),
      CacheModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({ mode: 'standalone', url: config.cache.url }),
      }),
      AuthModule.registerAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => config.auth,
      }),
    ],
  }).compile();
  await moduleRef.init();

  const db = moduleRef.get(DatabaseWriteClient);
  const accounts = moduleRef.get(AccountWriteRepository);
  const sessions = moduleRef.get(AuthSessionWriteRepository);
  const refreshTokens = moduleRef.get(RefreshTokenProtector);
  const accountIds: string[] = [];

  // Password hashes are opaque here: repositories compare them, they never verify a password.
  async function createAccount(passwordHash = 'hash-1'): Promise<string> {
    const id = crypto.randomUUID();
    await db.user.create({
      data: {
        id,
        email: `int-${id.slice(0, 8)}@cinema.local`,
        passwordHash,
        isEmailVerified: true,
      },
    });
    accountIds.push(id);
    return id;
  }

  // Starts a session the way login does; returns it with its plain refresh token.
  async function login(
    accountId: string,
    passwordHash = 'hash-1',
    now = new Date(),
    surface: AuthSessionSurface = 'USER',
  ) {
    const id = AuthSession.newId();
    const issued = refreshTokens.issue({ sessionId: id, now });
    const session = await sessions.start(accountId, passwordHash, surface, now, (active) => {
      AuthSession.makeRoomForLogin(active, now);
      return AuthSession.start({
        id,
        accountId,
        surface,
        refreshToken: issued.refreshToken,
        now,
        userAgent: 'int',
        ipAddress: null,
      });
    });
    return { session, token: issued.token, digest: refreshTokens.digest(issued.token)! };
  }

  const activeSessions = (accountId: string) =>
    db.authSession.findMany({ where: { accountId, revokedAt: null } });

  async function close(): Promise<void> {
    await db.user.deleteMany({ where: { id: { in: accountIds } } });
    await moduleRef.close();
  }

  return {
    moduleRef,
    db,
    accounts,
    sessions,
    refreshTokens,
    createAccount,
    login,
    activeSessions,
    close,
  };
}

export type AuthSetup = Awaited<ReturnType<typeof setupAuth>>;
