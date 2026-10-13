import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthMailer } from '@repo/auth';
import { DatabaseWriteClient } from '@repo/database';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';

type Body = { success: boolean; code?: string; requestId?: string; data?: Record<string, unknown> };

describe('API (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseWriteClient;
  let userId: string;
  // Captures verification codes instead of sending email.
  const mailer = {
    codes: new Map<string, string>(),
    sendVerificationCode(input: { verificationId: string; otp: string }) {
      this.codes.set(input.verificationId, input.otp);
    },
    sendPasswordResetCode() {},
  };
  const account = { email: `e2e-${crypto.randomUUID()}@cinema.test`, password: 'correct-horse' };

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AuthMailer)
      .useValue(mailer)
      .compile();
    app = moduleRef.createNestApplication();
    setupHttp(app);
    await app.init();
    db = app.get(DatabaseWriteClient);

    await api().post('/api/v1/auth/register').send(account).expect(202);
    userId = (await db.user.findUniqueOrThrow({ where: { email: account.email } })).id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: account.email } });
    await app.close();
  });

  it('reads the registered user back', async () => {
    const res = await api().get(`/api/v1/admin/users/${userId}`).expect(200);

    expect(res.body).toMatchObject({
      success: true,
      data: { id: userId, email: account.email, isEmailVerified: false },
    });
  });

  // Until verified, registering again replaces the pending registration; only a verified email
  // is taken.
  it('rejects a duplicate of a verified email', async () => {
    const [verificationId, otp] = [...mailer.codes].at(-1)!;
    await api().post('/api/v1/auth/verify-email').send({ verificationId, otp }).expect(200);

    const res = await api().post('/api/v1/auth/register').send(account).expect(409);

    expect((res.body as Body).code).toBe('AUTH.EMAIL_ALREADY_EXISTS');
  });

  it('rejects invalid input', async () => {
    const res = await api()
      .post('/api/v1/auth/register')
      .send({ email: 'not-an-email', password: 'short' })
      .expect(400);

    expect((res.body as Body).code).toBe('VALIDATION');
  });

  it('returns 404 with a request id for an unknown user', async () => {
    const res = await api().get(`/api/v1/admin/users/${crypto.randomUUID()}`).expect(404);

    expect(res.body).toMatchObject({ success: false, code: 'USER.NOT_FOUND' });
    expect((res.body as Body).requestId).toBeDefined();
  });
});
