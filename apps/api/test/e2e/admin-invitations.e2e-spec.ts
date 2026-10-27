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
import { internalAccounts } from './support/internal-accounts';

type Body<T = Record<string, unknown>> = { code?: string; errors?: { code?: string }[]; data: T };
const body = <T>(res: request.Response) => res.body as Body<T>;
type Sent = { accountId: string; invitationId: string };

const INVITE = '/api/v1/admin/users/invitations';
const ADMIN_AUTH = '/api/v1/admin/auth';
const PASSWORD = 'invited-password-1';

// Captures codes instead of sending email.
const mailer = {
  codes: new Map<string, string>(),
  sendVerificationCode(input: { verificationId: string; otp: string }) {
    this.codes.set(input.verificationId, input.otp);
  },
  sendInvitation(input: { invitationId: string; otp: string }) {
    this.codes.set(input.invitationId, input.otp);
  },
  sendPasswordResetCode() {},
};

describe('Admin invitations (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseWriteClient;
  let origin: string;
  const staff = internalAccounts(() => app);
  const emails: string[] = [];
  const theaterIds: string[] = [];
  const clusterIds: string[] = [];
  let clusterX: string;
  let theaterA: string;
  let admin: string;
  let adminId: string;
  let managerA: string;

  const api = (token?: string) => {
    const agent = request.agent(app.getHttpServer());
    return token ? agent.set('Authorization', `Bearer ${token}`) : agent;
  };
  const newEmail = () => {
    const email = `invited-${crypto.randomUUID().slice(0, 8)}@cinema.local`;
    emails.push(email);
    return email;
  };
  const invite = (token: string, payload: Record<string, unknown>) =>
    api(token).post(INVITE).send(payload);
  const accept = (invitationId: string, otp = mailer.codes.get(invitationId)) =>
    api().post(`${ADMIN_AUTH}/accept-invitation`).send({ invitationId, otp, password: PASSWORD });
  const login = (email: string, password = PASSWORD) =>
    api().post(`${ADMIN_AUTH}/login`).set('Origin', origin).send({ email, password });

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

    clusterX = (await db.cluster.create({ data: { name: `Invite ${crypto.randomUUID()}` } })).id;
    clusterIds.push(clusterX);
    theaterA = (
      await db.theater.create({
        data: {
          clusterId: clusterX,
          name: 'Invite A',
          slug: `invite-${crypto.randomUUID().slice(0, 8)}`,
          streetAddress: '1 Test Street',
          ward: 'Ward 1',
          province: 'Ho Chi Minh',
        },
      })
    ).id;
    theaterIds.push(theaterA);

    const superAdmin = await staff.create('SUPER_ADMIN');
    adminId = superAdmin.id;
    admin = (await staff.signIn(superAdmin.email, origin)).accessToken;
    managerA = (
      await staff.signIn(
        (await staff.create('THEATER_MANAGER', { theaterId: theaterA })).email,
        origin,
      )
    ).accessToken;
  });

  beforeEach(() => app.get(CacheClient).flushdb());

  afterAll(async () => {
    try {
      await staff.cleanup();
      await db.user.deleteMany({ where: { email: { in: emails } } });
      await db.room.deleteMany({ where: { theaterId: { in: theaterIds } } });
      await db.theater.deleteMany({ where: { id: { in: theaterIds } } });
      await db.cluster.deleteMany({ where: { id: { in: clusterIds } } });
    } finally {
      await app.close();
    }
  });

  it('invites a theater manager who accepts, signs in and manages their theater', async () => {
    const email = newEmail();

    const res = await invite(admin, {
      email,
      role: 'THEATER_MANAGER',
      scope: 'THEATER',
      theaterId: theaterA,
    }).expect(202);
    const { invitationId } = body<Sent>(res).data;

    // Not usable before acceptance: the password is unknown and the email unverified.
    await login(email).expect(401);
    await accept(invitationId).expect(200);
    const signedIn = await login(email).expect(200);
    const token = body<{ accessToken: string }>(signedIn).data.accessToken;

    await api(token)
      .post(`/api/v1/admin/theaters/${theaterA}/rooms`)
      .send({ code: 'INV1', name: 'Invited' })
      .expect(201);
    // An invited internal account never signs in as a customer.
    await api()
      .post('/api/v1/auth/login')
      .set('Origin', origin)
      .send({ email, password: PASSWORD })
      .expect(401);
  });

  it('invites at a cluster, and keeps who invited', async () => {
    const { accountId } = body<Sent>(
      await invite(admin, {
        email: newEmail(),
        role: 'CUSTOMER_SUPPORT',
        scope: 'CLUSTER',
        clusterId: clusterX,
      }).expect(202),
    ).data;

    const grant = await db.roleAssignment.findFirstOrThrow({ where: { userId: accountId } });
    expect(grant).toMatchObject({ scope: 'CLUSTER', clusterId: clusterX, grantedById: adminId });
  });

  it('leaves inviting to whoever may grant roles', async () => {
    const res = await invite(managerA, {
      email: newEmail(),
      role: 'BOX_OFFICE',
      scope: 'THEATER',
      theaterId: theaterA,
    }).expect(403);

    expect(body(res)).toMatchObject({
      code: 'IAM.PERMISSION_DENIED',
      errors: [{ code: 'roles:assign' }],
    });
  });

  it('refuses roles and scopes that cannot be invited', async () => {
    const codes = await Promise.all(
      [
        { role: 'CUSTOMER', scope: 'GLOBAL' },
        { role: 'BOX_OFFICE', scope: 'THEATER' },
        { role: 'USHER', scope: 'GLOBAL' },
        { role: 'CLUSTER_MANAGER', scope: 'CLUSTER', clusterId: crypto.randomUUID() },
        { role: 'NO_SUCH_ROLE', scope: 'GLOBAL' },
      ].map(async (payload) => body(await invite(admin, { email: newEmail(), ...payload })).code),
    );

    expect(codes).toEqual([
      'IAM.NOT_INTERNAL_ROLE',
      'IAM.ROLE_SCOPE_MISMATCH',
      'IAM.ROLE_SCOPE_MISMATCH',
      'IAM.CLUSTER_NOT_FOUND',
      'IAM.ROLE_NOT_FOUND',
    ]);
  });

  it('refuses an email that already has an account', async () => {
    const taken = await staff.create('CONTENT_MANAGER');

    const res = await invite(admin, {
      email: taken.email,
      role: 'CONTENT_MANAGER',
      scope: 'GLOBAL',
    }).expect(409);

    expect(body(res).code).toBe('AUTH.EMAIL_ALREADY_EXISTS');
  });

  it('sends a new code when a pending invitation is repeated', async () => {
    const email = newEmail();
    const payload = { email, role: 'CONTENT_MANAGER', scope: 'GLOBAL' };
    const first = body<Sent>(await invite(admin, payload).expect(202)).data;

    const again = body<Sent>(await invite(admin, payload).expect(202)).data;
    expect(again.accountId).toBe(first.accountId);
    expect(again.invitationId).not.toBe(first.invitationId);
    await accept(first.invitationId).expect(400);
    await accept(again.invitationId).expect(200);
  });

  it('refuses another role or place for a pending invitation', async () => {
    const email = newEmail();
    await invite(admin, { email, role: 'CONTENT_MANAGER', scope: 'GLOBAL' }).expect(202);

    const res = await invite(admin, {
      email,
      role: 'USHER',
      scope: 'THEATER',
      theaterId: theaterA,
    }).expect(409);

    expect(body(res).code).toBe('IAM.ACCOUNT_HAS_ROLE');
  });

  it('counts a wrong code', async () => {
    const { invitationId } = body<Sent>(
      await invite(admin, { email: newEmail(), role: 'CONTENT_MANAGER', scope: 'GLOBAL' }).expect(
        202,
      ),
    ).data;
    const wrong = mailer.codes.get(invitationId) === '000000' ? '111111' : '000000';

    const res = await accept(invitationId, wrong).expect(400);

    expect(body(res).code).toBe('AUTH.INVALID_EMAIL_OTP');
    const code = await db.authChallenge.findUniqueOrThrow({ where: { id: invitationId } });
    expect(code.failedAttempts).toBe(1);
  });
});
