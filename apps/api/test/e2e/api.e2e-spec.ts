import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';

type Body = { success: boolean; code?: string; requestId?: string; data?: Record<string, unknown> };

describe('API (e2e)', () => {
  let app: INestApplication;
  let userId: string;
  const account = { email: `e2e-${crypto.randomUUID()}@cinema.test`, password: 'correct-horse' };

  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupHttp(app);
    await app.init();

    const res = await api().post('/api/v1/auth/register').send(account).expect(201);
    userId = (res.body as Body).data?.id as string;
  });

  afterAll(() => app.close());

  it('reads the registered user back', async () => {
    const res = await api().get(`/api/v1/users/${userId}`).expect(200);

    expect(res.body).toMatchObject({
      success: true,
      data: { id: userId, email: account.email, isEmailVerified: false },
    });
  });

  it('rejects a duplicate email', async () => {
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
    const res = await api().get(`/api/v1/users/${crypto.randomUUID()}`).expect(404);

    expect(res.body).toMatchObject({ success: false, code: 'USER.NOT_FOUND' });
    expect((res.body as Body).requestId).toBeDefined();
  });
});
