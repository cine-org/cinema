import { once } from 'node:events';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthMailer } from '@repo/auth';
import { CacheClient } from '@repo/cache';
import { DatabaseWriteClient } from '@repo/database';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';
import { ConfigService } from '@/config';

type Body<T = Record<string, unknown>> = {
  success: boolean;
  code?: string;
  errors?: { code?: string; field?: string }[];
  data: T;
};
type Tokens = { accessToken: string; tokenType: string; accessTokenExpiresAt: string };
type SessionItem = { id: string; isCurrent: boolean };

const body = <T>(res: request.Response) => res.body as Body<T>;
const PASSWORD = 'e2e-password-1';
const AUTH = '/api/v1/auth';

// Captures codes instead of sending email.
class CapturingMailer implements AuthMailer {
  readonly codes = new Map<string, string>();
  sendVerificationCode(input: { verificationId: string; otp: string }): void {
    this.codes.set(input.verificationId, input.otp);
  }
  sendPasswordResetCode(input: { resetId: string; otp: string }): void {
    this.codes.set(input.resetId, input.otp);
  }
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseWriteClient;
  let origin: string;
  const mailer = new CapturingMailer();
  const emails: string[] = [];

  const api = () => request(app.getHttpServer());
  const newEmail = () => {
    const email = `e2e-${crypto.randomUUID().slice(0, 8)}@cinema.local`;
    emails.push(email);
    return email;
  };

  async function registerVerified(email = newEmail(), password = PASSWORD): Promise<string> {
    const res = await api().post(`${AUTH}/register`).send({ email, password }).expect(202);
    const { verificationId } = body<{ verificationId: string }>(res).data;
    await api()
      .post(`${AUTH}/verify-email`)
      .send({ verificationId, otp: mailer.codes.get(verificationId) })
      .expect(200);
    return email;
  }

  // A browser: keeps the refresh cookie and sends the trusted Origin.
  async function login(email: string, password = PASSWORD) {
    const agent = request.agent(app.getHttpServer());
    const res = await agent
      .post(`${AUTH}/login`)
      .set('Origin', origin)
      .send({ email, password })
      .expect(200);
    return { agent, res, accessToken: body<Tokens>(res).data.accessToken };
  }

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

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
    // The app connects to Redis in the background without an offline queue; wait for it here.
    const cache = app.get(CacheClient);
    if (cache.status !== 'ready') await once(cache, 'ready');
  });

  // Rate limits are per IP and per email; every test starts with a clean budget.
  beforeEach(() => app.get(CacheClient).flushdb());

  afterAll(async () => {
    await db.user.deleteMany({ where: { email: { in: emails } } });
    await app.close();
  });

  it('registers every account as a customer', async () => {
    const email = newEmail();
    await api().post(`${AUTH}/register`).send({ email, password: PASSWORD }).expect(202);

    const roles = await db.roleAssignment.findMany({
      where: { user: { email }, revokedAt: null },
      select: { scope: true, role: { select: { key: true } } },
    });
    expect(roles).toEqual([{ scope: 'SELF', role: { key: 'CUSTOMER' } }]);
  });

  describe('login', () => {
    it('returns an access token and sets the refresh cookie', async () => {
      const email = await registerVerified();

      const { res } = await login(email);

      expect(body<Tokens>(res).data).toMatchObject({ tokenType: 'Bearer' });
      expect(JSON.stringify(res.body)).not.toContain('refresh');
      const cookie = String(res.headers['set-cookie']);
      expect(cookie).toMatch(/^refresh_token=[A-Za-z0-9_-]{43};/);
      expect(cookie).toContain('Path=/api/v1/auth');
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('SameSite=Strict');
    });

    it.each([
      ['without Origin', undefined],
      ['from an untrusted Origin', 'https://evil.example'],
    ])('refuses a request %s', async (_, from) => {
      const req = api().post(`${AUTH}/login`).send({ email: newEmail(), password: PASSWORD });
      const res = await (from ? req.set('Origin', from) : req).expect(403);

      expect(body(res).code).toBe('FORBIDDEN');
    });

    it('gives the same error for an unknown email and a wrong password', async () => {
      const email = await registerVerified();

      const unknown = await api()
        .post(`${AUTH}/login`)
        .set('Origin', origin)
        .send({ email: newEmail(), password: PASSWORD })
        .expect(401);
      const wrong = await api()
        .post(`${AUTH}/login`)
        .set('Origin', origin)
        .send({ email, password: 'wrong-password' })
        .expect(401);

      expect(body(unknown).code).toBe('AUTH.INVALID_CREDENTIALS');
      expect(body(wrong).code).toBe('AUTH.INVALID_CREDENTIALS');
    });

    it('tells an unverified account apart only with the right password', async () => {
      const email = newEmail();
      await api().post(`${AUTH}/register`).send({ email, password: PASSWORD }).expect(202);

      const res = await api()
        .post(`${AUTH}/login`)
        .set('Origin', origin)
        .send({ email, password: PASSWORD })
        .expect(403);

      expect(body(res).code).toBe('AUTH.EMAIL_NOT_VERIFIED');
    });
  });

  describe('bearer', () => {
    it('lists the active sessions, marking the current one', async () => {
      const email = await registerVerified();
      await login(email);
      const { accessToken } = await login(email);

      const res = await api().get(`${AUTH}/sessions`).set(bearer(accessToken)).expect(200);

      const sessions = body<SessionItem[]>(res).data;
      expect(sessions).toHaveLength(2);
      expect(sessions.filter((s) => s.isCurrent)).toHaveLength(1);
    });

    it.each([
      ['no token', {}],
      ['a malformed token', bearer('abc.def.ghi')],
    ])('rejects %s', async (_, headers) => {
      const res = await api().get(`${AUTH}/sessions`).set(headers).expect(401);

      expect(body(res).code).toBe('AUTH.INVALID_ACCESS_TOKEN');
    });
  });

  describe('refresh', () => {
    it('rotates the cookie; the old cookie right after is a concurrent refresh', async () => {
      const email = await registerVerified();
      const { agent, res: loginRes } = await login(email);
      const oldCookie = String(loginRes.headers['set-cookie']).split(';')[0]!;

      const refreshed = await agent.post(`${AUTH}/refresh`).set('Origin', origin).expect(200);
      expect(String(refreshed.headers['set-cookie']).split(';')[0]).not.toBe(oldCookie);

      const reused = await api()
        .post(`${AUTH}/refresh`)
        .set('Origin', origin)
        .set('Cookie', oldCookie)
        .expect(409);
      expect(body(reused).code).toBe('AUTH.REFRESH_TOKEN_REUSED');

      // The browser's cookie still works.
      await agent.post(`${AUTH}/refresh`).set('Origin', origin).expect(200);
    });

    it('rejects a missing cookie', async () => {
      const res = await api().post(`${AUTH}/refresh`).set('Origin', origin).expect(401);

      expect(body(res).code).toBe('AUTH.INVALID_REFRESH_TOKEN');
    });
  });

  describe('logout', () => {
    it('ends the session at once and clears the cookie', async () => {
      const email = await registerVerified();
      const { agent, accessToken } = await login(email);

      const res = await agent.post(`${AUTH}/logout`).set('Origin', origin).expect(200);
      expect(String(res.headers['set-cookie'])).toContain('refresh_token=;');

      const after = await api().get(`${AUTH}/sessions`).set(bearer(accessToken)).expect(401);
      expect(body(after)).toMatchObject({
        code: 'AUTH.SESSION_ENDED',
        errors: [{ code: 'LOGOUT' }],
      });
    });

    it('succeeds without a cookie', async () => {
      await api().post(`${AUTH}/logout`).set('Origin', origin).expect(200);
    });

    it('logs out of every device', async () => {
      const email = await registerVerified();
      const other = await login(email);
      const { accessToken } = await login(email);

      const res = await api().post(`${AUTH}/logout-all`).set(bearer(accessToken)).expect(200);

      expect(body<{ revokedSessions: number }>(res).data.revokedSessions).toBe(2);
      await other.agent.post(`${AUTH}/refresh`).set('Origin', origin).expect(401);
    });

    it('revokes one session of the caller, and nobody else’s', async () => {
      const email = await registerVerified();
      const { accessToken: target } = await login(email);
      const { accessToken } = await login(email);
      const sessions = body<SessionItem[]>(
        await api().get(`${AUTH}/sessions`).set(bearer(accessToken)),
      ).data;
      const other = sessions.find((s) => !s.isCurrent)!;

      const stranger = await login(await registerVerified());
      await api()
        .delete(`${AUTH}/sessions/${other.id}`)
        .set(bearer(stranger.accessToken))
        .expect(404);

      await api().delete(`${AUTH}/sessions/${other.id}`).set(bearer(accessToken)).expect(200);
      await api().get(`${AUTH}/sessions`).set(bearer(target)).expect(401);
      await api().delete(`${AUTH}/sessions/${other.id}`).set(bearer(accessToken)).expect(404);
    });
  });

  describe('password', () => {
    it('resets with the emailed code, ending every session', async () => {
      const email = await registerVerified();
      const { accessToken } = await login(email);

      const forgot = await api().post(`${AUTH}/forgot-password`).send({ email }).expect(202);
      const { resetId } = body<{ resetId: string }>(forgot).data;
      const wrong = mailer.codes.get(resetId) === '000000' ? '111111' : '000000';
      await api()
        .post(`${AUTH}/reset-password`)
        .send({ resetId, otp: wrong, newPassword: 'reset-password-1' })
        .expect(400);
      await api()
        .post(`${AUTH}/reset-password`)
        .send({ resetId, otp: mailer.codes.get(resetId), newPassword: 'reset-password-1' })
        .expect(200);

      const ended = await api().get(`${AUTH}/sessions`).set(bearer(accessToken)).expect(401);
      expect(body(ended).errors).toEqual([expect.objectContaining({ code: 'PASSWORD_RESET' })]);
      await api()
        .post(`${AUTH}/login`)
        .set('Origin', origin)
        .send({ email, password: PASSWORD })
        .expect(401);
      await login(email, 'reset-password-1');
    });

    it('answers forgot-password the same for an unknown email, without email', async () => {
      const before = mailer.codes.size;

      const res = await api()
        .post(`${AUTH}/forgot-password`)
        .send({ email: newEmail() })
        .expect(202);

      expect(body<{ resetId: string }>(res).data.resetId).toBeDefined();
      expect(mailer.codes.size).toBe(before);
    });

    it('verifies an unverified email through a reset', async () => {
      const email = newEmail();
      await api().post(`${AUTH}/register`).send({ email, password: PASSWORD }).expect(202);

      const forgot = await api().post(`${AUTH}/forgot-password`).send({ email }).expect(202);
      const { resetId } = body<{ resetId: string }>(forgot).data;
      await api()
        .post(`${AUTH}/reset-password`)
        .send({ resetId, otp: mailer.codes.get(resetId), newPassword: 'reset-password-1' })
        .expect(200);

      await login(email, 'reset-password-1');
    });

    it('changes the password, ending every session and clearing the cookie', async () => {
      const email = await registerVerified();
      const other = await login(email);
      const { accessToken } = await login(email);

      await api()
        .post(`${AUTH}/change-password`)
        .set(bearer(accessToken))
        .send({ currentPassword: 'wrong-password', newPassword: 'changed-password-1' })
        .expect(400);
      const res = await api()
        .post(`${AUTH}/change-password`)
        .set(bearer(accessToken))
        .send({ currentPassword: PASSWORD, newPassword: 'changed-password-1' })
        .expect(200);

      expect(String(res.headers['set-cookie'])).toContain('refresh_token=;');
      const ended = await api().get(`${AUTH}/sessions`).set(bearer(accessToken)).expect(401);
      expect(body(ended).errors).toEqual([expect.objectContaining({ code: 'PASSWORD_CHANGED' })]);
      await other.agent.post(`${AUTH}/refresh`).set('Origin', origin).expect(401);
      await login(email, 'changed-password-1');
    });
  });
});
