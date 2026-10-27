import { once } from 'node:events';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AUTH_SESSION_POLICY, AuthMailer } from '@repo/auth';
import { CacheClient } from '@repo/cache';
import { DatabaseWriteClient } from '@repo/database';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';
import { ConfigService } from '@/config';
import { INTERNAL_PASSWORD, internalAccounts } from './support/internal-accounts';

type Body<T = Record<string, unknown>> = { success: boolean; code?: string; data: T };
const body = <T>(res: request.Response) => res.body as Body<T>;

const ADMIN_AUTH = '/api/v1/admin/auth';
const AUTH = '/api/v1/auth';
const CUSTOMER_PASSWORD = 'customer-password-1';

// Captures verification codes instead of sending email.
const mailer = {
  codes: new Map<string, string>(),
  sendVerificationCode(input: { verificationId: string; otp: string }) {
    this.codes.set(input.verificationId, input.otp);
  },
  sendPasswordResetCode() {},
};

describe('Admin auth (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseWriteClient;
  let origin: string;
  const staff = internalAccounts(() => app);
  const customerEmails: string[] = [];

  const api = () => request(app.getHttpServer());
  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  async function customer() {
    const email = `cust-${crypto.randomUUID().slice(0, 8)}@cinema.local`;
    customerEmails.push(email);
    const res = await api().post(`${AUTH}/register`).send({ email, password: CUSTOMER_PASSWORD });
    const { verificationId } = body<{ verificationId: string }>(res).data;
    await api()
      .post(`${AUTH}/verify-email`)
      .send({ verificationId, otp: mailer.codes.get(verificationId) })
      .expect(200);
    return email;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthMailer)
      .useValue(mailer)
      .compile();
    app = moduleRef.createNestApplication();
    setupHttp(app);
    await app.init();
    db = app.get(DatabaseWriteClient);
    origin = new URL(app.get(ConfigService).app.apiOrigin).origin;
    const cache = app.get(CacheClient);
    if (cache.status !== 'ready') await once(cache, 'ready');
  });

  beforeEach(() => app.get(CacheClient).flushdb());

  afterAll(async () => {
    await staff.cleanup();
    await db.user.deleteMany({ where: { email: { in: customerEmails } } });
    await app.close();
  });

  it('signs an internal account in with its own cookie and a shorter session', async () => {
    const { email, id } = await staff.create('THEATER_MANAGER', {
      theaterId: await anyTheaterId(),
    });

    const { res } = await staff.signIn(email, origin);

    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^admin_refresh_token=[A-Za-z0-9_-]{43};/);
    expect(cookie).toContain('Path=/api/v1/admin/auth');
    expect(cookie).toContain('HttpOnly');
    const session = await db.authSession.findFirstOrThrow({ where: { accountId: id } });
    expect(session.surface).toBe('ADMIN');
    const idleSeconds = (session.idleExpiresAt.getTime() - session.createdAt.getTime()) / 1000;
    expect(idleSeconds).toBe(AUTH_SESSION_POLICY.lifetimes.ADMIN.idleTtlSeconds);
  });

  it('keeps each kind of account on its own side', async () => {
    const internal = await staff.create('SUPER_ADMIN');
    const customerEmail = await customer();

    const internalOnUser = await api()
      .post(`${AUTH}/login`)
      .set('Origin', origin)
      .send({ email: internal.email, password: INTERNAL_PASSWORD })
      .expect(401);
    const customerOnAdmin = await api()
      .post(`${ADMIN_AUTH}/login`)
      .set('Origin', origin)
      .send({ email: customerEmail, password: CUSTOMER_PASSWORD })
      .expect(401);

    expect(body(internalOnUser).code).toBe('AUTH.INVALID_CREDENTIALS');
    expect(body(customerOnAdmin).code).toBe('AUTH.INVALID_CREDENTIALS');
  });

  it('accepts each access token on its own side only', async () => {
    const { accessToken: adminToken } = await staff.signIn(
      (await staff.create('SUPER_ADMIN')).email,
      origin,
    );
    const customerRes = await api()
      .post(`${AUTH}/login`)
      .set('Origin', origin)
      .send({ email: await customer(), password: CUSTOMER_PASSWORD })
      .expect(200);
    const customerToken = body<{ accessToken: string }>(customerRes).data.accessToken;

    await api().get(`${ADMIN_AUTH}/sessions`).set(bearer(adminToken)).expect(200);
    await api().get(`${AUTH}/sessions`).set(bearer(customerToken)).expect(200);
    const crossed = [
      await api().get(`${AUTH}/sessions`).set(bearer(adminToken)).expect(401),
      await api().get(`${ADMIN_AUTH}/sessions`).set(bearer(customerToken)).expect(401),
    ];
    expect(crossed.map((res) => body(res).code)).toEqual([
      'AUTH.INVALID_ACCESS_TOKEN',
      'AUTH.INVALID_ACCESS_TOKEN',
    ]);
  });

  it('refreshes with the admin cookie and logs out', async () => {
    const { agent } = await staff.signIn(
      (await staff.create('BOX_OFFICE', { theaterId: await anyTheaterId() })).email,
      origin,
    );

    await agent.post(`${ADMIN_AUTH}/refresh`).set('Origin', origin).expect(200);
    // The customer refresh route reads another cookie.
    await agent.post(`${AUTH}/refresh`).set('Origin', origin).expect(401);
    await agent.post(`${ADMIN_AUTH}/logout`).set('Origin', origin).expect(200);
    await agent.post(`${ADMIN_AUTH}/refresh`).set('Origin', origin).expect(401);
  });

  it('stops an account at once when its role is revoked', async () => {
    const { id, email } = await staff.create('CONTENT_MANAGER');
    const { accessToken, agent } = await staff.signIn(email, origin);

    await db.roleAssignment.updateMany({ where: { userId: id }, data: { revokedAt: new Date() } });

    await api().get(`${ADMIN_AUTH}/sessions`).set(bearer(accessToken)).expect(401);
    await agent.post(`${ADMIN_AUTH}/refresh`).set('Origin', origin).expect(401);
  });

  it('refuses a request without a trusted Origin', async () => {
    const { email } = await staff.create('SUPER_ADMIN');

    await api()
      .post(`${ADMIN_AUTH}/login`)
      .send({ email, password: INTERNAL_PASSWORD })
      .expect(403);
  });

  async function anyTheaterId(): Promise<string> {
    const theater = await db.theater.create({
      data: {
        name: 'Admin auth e2e',
        slug: `admin-auth-${crypto.randomUUID().slice(0, 8)}`,
        streetAddress: '1 Test Street',
        ward: 'Ward 1',
        province: 'Ho Chi Minh',
      },
    });
    theaterIds.push(theater.id);
    return theater.id;
  }
  const theaterIds: string[] = [];
  afterAll(() => db.theater.deleteMany({ where: { id: { in: theaterIds } } }));
});
