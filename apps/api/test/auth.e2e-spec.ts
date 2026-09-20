import type { INestApplication } from '@nestjs/common';
import type { Server } from 'node:http';
import { RequestMethod, VersioningType } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DatabaseClient, UserStatus } from '@repo/database';
import { TokenService } from '@repo/auth';
import { PERMISSION_CODE, SYSTEM_ROLE_CODE } from '@repo/contracts';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { GlobalExceptionFilter } from '@/common/filters';

type EmailPayload = { token: string };

describe('authentication lifecycle (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseClient;
  let tokens: TokenService;
  let superAdminRoleId: string;

  beforeAll(async () => {
    if (process.env.NODE_ENV !== 'test' || !process.env.DATABASE_URL?.includes('test')) {
      throw new Error('E2E cleanup is restricted to a test database');
    }
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('/api', {
      exclude: [
        { path: 'health', method: RequestMethod.ALL },
        { path: 'health/live', method: RequestMethod.ALL },
        { path: 'health/ready', method: RequestMethod.ALL },
      ],
    });
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();
    db = app.get(DatabaseClient);
    tokens = app.get(TokenService);

    await db.$transaction(async (tx) => {
      await tx.outboxMessage.deleteMany();
      await tx.securityAuditEvent.deleteMany();
      await tx.user.deleteMany();
      await tx.rolePermission.deleteMany();
      await tx.role.deleteMany();
      await tx.permission.deleteMany();
      const permissions = await Promise.all([
        tx.permission.create({ data: { code: PERMISSION_CODE.User.ReadOwn } }),
        tx.permission.create({ data: { code: PERMISSION_CODE.User.UpdateOwn } }),
        tx.permission.create({ data: { code: PERMISSION_CODE.User.DeleteOwn } }),
        tx.permission.create({ data: { code: PERMISSION_CODE.User.ReadAny } }),
        tx.permission.create({ data: { code: PERMISSION_CODE.User.RevokeRoleAny } }),
        tx.permission.create({ data: { code: PERMISSION_CODE.Role.UpdateAny } }),
      ]);
      const customer = await tx.role.create({
        data: { code: SYSTEM_ROLE_CODE.CUSTOMER, name: 'Customer', type: 'SYSTEM' },
      });
      await tx.rolePermission.createMany({
        data: permissions.slice(0, 3).map((permission) => ({
          roleId: customer.id,
          permissionId: permission.id,
        })),
      });
      const superAdmin = await tx.role.create({
        data: { code: SYSTEM_ROLE_CODE.SUPER_ADMIN, name: 'Super Admin', type: 'SYSTEM' },
      });
      superAdminRoleId = superAdmin.id;
      await tx.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: superAdmin.id,
          permissionId: permission.id,
        })),
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers, verifies, rotates/rejects reuse, and resets the password', async () => {
    const server = app.getHttpServer() as Server;
    await request(server)
      .post('/api/v1/auth/register')
      .send({
        email: 'viewer@example.test',
        username: 'viewer',
        password: 'initial-password-123',
        fullName: 'Viewer',
      })
      .expect(201);

    const verification = await db.outboxMessage.findFirstOrThrow({
      where: { topic: 'auth.verify_email' },
      orderBy: { createdAt: 'desc' },
    });
    expect(verification.encryptedPayload).not.toContain('viewer@example.test');
    const verifyPayload = tokens.decryptOutbox(verification.encryptedPayload) as EmailPayload;
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@example.test', password: 'initial-password-123' })
      .expect(403);
    await request(server)
      .post('/api/v1/auth/verify-email')
      .send({ token: verifyPayload.token })
      .expect(204);

    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'viewer@example.test',
        password: 'initial-password-123',
        deviceName: 'E2E browser',
      })
      .expect(200);
    const firstCookie = cookie(login.headers['set-cookie']);
    const firstAccess = login.body.accessToken as string;
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${firstAccess}`)
      .expect(200);

    const concurrent = await Promise.all([
      request(server)
        .post('/api/v1/auth/refresh')
        .set('Origin', 'http://localhost:4000')
        .set('Cookie', firstCookie),
      request(server)
        .post('/api/v1/auth/refresh')
        .set('Origin', 'http://localhost:4000')
        .set('Cookie', firstCookie),
    ]);
    expect(concurrent.map((response) => response.status).sort()).toEqual([200, 401]);
    const refreshed = concurrent.find((response) => response.status === 200)!;
    const secondCookie = cookie(refreshed.headers['set-cookie']);
    const secondAccess = refreshed.body.accessToken as string;

    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${secondAccess}`)
      .expect(401);

    const relogin = await request(server)
      .post('/api/v1/auth/login')
      .send({
        email: 'viewer@example.test',
        password: 'initial-password-123',
      })
      .expect(200);
    const accessBeforeReset = relogin.body.accessToken as string;

    await request(server)
      .post('/api/v1/auth/forgot-password')
      .send({ email: 'viewer@example.test' })
      .expect(202);
    const reset = await db.outboxMessage.findFirstOrThrow({
      where: { topic: 'auth.reset_password' },
      orderBy: { createdAt: 'desc' },
    });
    const resetPayload = tokens.decryptOutbox(reset.encryptedPayload) as EmailPayload;
    await request(server)
      .post('/api/v1/auth/reset-password')
      .send({ token: resetPayload.token, password: 'replacement-password-456' })
      .expect(204);

    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${accessBeforeReset}`)
      .expect(401);
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@example.test', password: 'initial-password-123' })
      .expect(401);
    const finalLogin = await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@example.test', password: 'replacement-password-456' })
      .expect(200);
    const finalAccess = finalLogin.body.accessToken as string;
    const identity = await db.userIdentity.findUniqueOrThrow({
      where: {
        type_normalizedIdentifier: { type: 'EMAIL', normalizedIdentifier: 'viewer@example.test' },
      },
    });
    await db.user.update({
      where: { id: identity.userId },
      data: { status: UserStatus.SUSPENDED, statusChangedAt: new Date() },
    });
    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${finalAccess}`)
      .expect(403);
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@example.test', password: 'replacement-password-456' })
      .expect(403);
    await db.user.update({
      where: { id: identity.userId },
      data: { status: UserStatus.DEACTIVATED, statusChangedAt: new Date() },
    });
    await request(server)
      .post('/api/v1/auth/login')
      .send({ email: 'viewer@example.test', password: 'replacement-password-456' })
      .expect(403);

    expect(secondCookie).toContain('cinema_refresh=');
    expect(await db.securityAuditEvent.count({ where: { action: 'auth.refresh_reuse' } })).toBe(1);
  });

  it('enforces own/any permissions, immutable system roles, and immediate role revocation', async () => {
    const server = app.getHttpServer() as Server;
    const customer = await registerVerifyLogin(server, 'customer2@example.test', 'customer2');
    const admin = await registerVerifyLogin(server, 'admin@example.test', 'admin-user');
    await db.userRole.create({
      data: { userId: admin.userId, roleId: superAdminRoleId },
    });

    await request(server)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(200);
    await request(server)
      .get(`/api/v1/users/${admin.userId}`)
      .set('Authorization', `Bearer ${customer.accessToken}`)
      .expect(403);
    await request(server)
      .get(`/api/v1/users/${customer.userId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);
    await request(server)
      .patch(`/api/v1/roles/${superAdminRoleId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ name: 'Changed system role' })
      .expect(409);

    await request(server)
      .delete(`/api/v1/users/${admin.userId}/roles/${superAdminRoleId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);
    await request(server)
      .get(`/api/v1/users/${customer.userId}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(403);
  });

  async function registerVerifyLogin(
    server: Server,
    email: string,
    username: string,
  ): Promise<{ accessToken: string; userId: string }> {
    const password = 'e2e-password-12345';
    await request(server)
      .post('/api/v1/auth/register')
      .send({ email, username, password })
      .expect(201);
    const verification = await db.outboxMessage.findFirstOrThrow({
      where: { topic: 'auth.verify_email' },
      orderBy: { createdAt: 'desc' },
    });
    const payload = tokens.decryptOutbox(verification.encryptedPayload) as EmailPayload;
    await request(server)
      .post('/api/v1/auth/verify-email')
      .send({ token: payload.token })
      .expect(204);
    const login = await request(server)
      .post('/api/v1/auth/login')
      .send({ email, password })
      .expect(200);
    const identity = await db.userIdentity.findUniqueOrThrow({
      where: { type_normalizedIdentifier: { type: 'EMAIL', normalizedIdentifier: email } },
    });
    return { accessToken: login.body.accessToken as string, userId: identity.userId };
  }
});

function cookie(header: string | string[] | undefined): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) throw new Error('Expected refresh cookie');
  return value.split(';', 1)[0]!;
}
