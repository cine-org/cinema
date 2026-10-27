import { once } from 'node:events';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { CacheClient } from '@repo/cache';
import { DatabaseWriteClient } from '@repo/database';
import request from 'supertest';
import { AppModule } from '@/app.module';
import { setupHttp } from '@/bootstrap';
import { ConfigService } from '@/config';
import { internalAccounts } from './support/internal-accounts';

type Body<T = unknown> = { code?: string; errors?: { code?: string }[]; data: T };
const body = <T>(res: request.Response) => res.body as Body<T>;
const ADMIN = '/api/v1/admin';

describe('Admin API access (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseWriteClient;
  let origin: string;
  const staff = internalAccounts(() => app);
  const theaterIds: string[] = [];
  const clusterIds: string[] = [];
  let theaterA: string;
  let theaterB: string;
  let roomB: string;
  let admin: string;
  let clusterManagerX: string;
  let managerA: string;
  let boxOfficeA: string;

  const api = (token?: string) => {
    const agent = request.agent(app.getHttpServer());
    return token ? agent.set('Authorization', `Bearer ${token}`) : agent;
  };
  const signIn = async (role: string, place: { clusterId?: string; theaterId?: string } = {}) =>
    (await staff.signIn((await staff.create(role, place)).email, origin)).accessToken;
  const denied = (res: request.Response, permission: string) =>
    expect(body(res)).toMatchObject({
      code: 'IAM.PERMISSION_DENIED',
      errors: [{ code: permission }],
    });

  async function cluster(name: string) {
    const created = await db.cluster.create({
      data: { name: `${name} ${crypto.randomUUID().slice(0, 8)}` },
    });
    clusterIds.push(created.id);
    return created.id;
  }

  async function theater(name: string, clusterId: string) {
    const created = await db.theater.create({
      data: {
        clusterId,
        name,
        slug: `access-${crypto.randomUUID().slice(0, 8)}`,
        streetAddress: '1 Test Street',
        ward: 'Ward 1',
        province: 'Ho Chi Minh',
      },
    });
    theaterIds.push(created.id);
    return created.id;
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupHttp(app);
    await app.init();
    db = app.get(DatabaseWriteClient);
    origin = new URL(app.get(ConfigService).app.apiOrigin).origin;
    const cache = app.get(CacheClient);
    if (cache.status !== 'ready') await once(cache, 'ready');
    await cache.flushdb();

    // Theater A in cluster X, theater B in cluster Y.
    const clusterX = await cluster('Access X');
    theaterA = await theater('Access A', clusterX);
    theaterB = await theater('Access B', await cluster('Access Y'));
    roomB = (await db.room.create({ data: { theaterId: theaterB, code: 'B01', name: 'B' } })).id;
    admin = await signIn('SUPER_ADMIN');
    clusterManagerX = await signIn('CLUSTER_MANAGER', { clusterId: clusterX });
    managerA = await signIn('THEATER_MANAGER', { theaterId: theaterA });
    boxOfficeA = await signIn('BOX_OFFICE', { theaterId: theaterA });
  });

  // Sign-ins are rate limited per IP.
  beforeEach(() => app.get(CacheClient).flushdb());

  afterAll(async () => {
    try {
      await staff.cleanup();
      await db.room.deleteMany({ where: { theaterId: { in: theaterIds } } });
      await db.theater.deleteMany({ where: { id: { in: theaterIds } } });
      await db.cluster.deleteMany({ where: { id: { in: clusterIds } } });
    } finally {
      await app.close();
    }
  });

  it('refuses an admin route without a session', async () => {
    const res = await api().get(`${ADMIN}/theaters`).expect(401);

    expect(body(res).code).toBe('AUTH.INVALID_ACCESS_TOKEN');
  });

  it('lets a SUPER_ADMIN act on any theater', async () => {
    await api(admin).get(`${ADMIN}/theaters/${theaterB}`).expect(200);
    await api(admin).get(`${ADMIN}/rooms/${roomB}`).expect(200);
  });

  it('lets a cluster manager work on the theaters of their cluster only', async () => {
    const list = await api(clusterManagerX).get(`${ADMIN}/theaters?limit=100`).expect(200);
    expect(body<{ id: string }[]>(list).data.map((t) => t.id)).toEqual([theaterA]);

    await api(clusterManagerX)
      .post(`${ADMIN}/theaters/${theaterA}/rooms`)
      .send({ code: 'C01', name: 'C' })
      .expect(201);
    denied(
      await api(clusterManagerX).patch(`${ADMIN}/rooms/${roomB}`).send({ name: 'X' }).expect(403),
      'rooms:update',
    );
  });

  it('shows a theater manager their own theater only', async () => {
    const list = await api(managerA).get(`${ADMIN}/theaters?limit=100`).expect(200);
    expect(body<{ id: string }[]>(list).data.map((t) => t.id)).toEqual([theaterA]);

    denied(await api(managerA).get(`${ADMIN}/theaters/${theaterB}`).expect(403), 'theaters:read');
  });

  it('lets a theater manager manage rooms of their theater, not of another', async () => {
    await api(managerA)
      .post(`${ADMIN}/theaters/${theaterA}/rooms`)
      .send({ code: 'A01', name: 'A' })
      .expect(201);

    denied(
      await api(managerA)
        .post(`${ADMIN}/theaters/${theaterB}/rooms`)
        .send({ code: 'X01', name: 'X' })
        .expect(403),
      'rooms:create',
    );
    denied(
      await api(managerA).patch(`${ADMIN}/rooms/${roomB}`).send({ name: 'Hijacked' }).expect(403),
      'rooms:update',
    );
  });

  it('refuses an unknown id like another theater, without telling them apart', async () => {
    denied(
      await api(managerA).get(`${ADMIN}/rooms/${crypto.randomUUID()}`).expect(403),
      'rooms:read',
    );
  });

  it('keeps cluster and theater roles off what is not tied to one theater', async () => {
    denied(
      await api(clusterManagerX)
        .post(`${ADMIN}/theaters`)
        .send({
          name: 'New',
          slug: `x-${crypto.randomUUID().slice(0, 8)}`,
          streetAddress: '1',
          ward: 'W',
          province: 'P',
        })
        .expect(403),
      'theaters:create',
    );
    denied(
      await api(managerA).get(`${ADMIN}/users/${crypto.randomUUID()}`).expect(403),
      'users:read.any',
    );
  });

  it('lets any internal role read the shared seat type catalog', async () => {
    await api(boxOfficeA).get(`${ADMIN}/seat-types`).expect(200);
  });

  it('lets box office staff read their theater but not change it', async () => {
    await api(boxOfficeA).get(`${ADMIN}/theaters/${theaterA}`).expect(200);

    denied(
      await api(boxOfficeA)
        .post(`${ADMIN}/theaters/${theaterA}/rooms`)
        .send({ code: 'S01', name: 'S' })
        .expect(403),
      'rooms:create',
    );
  });

  it('applies a role permission change on the next request', async () => {
    const manager = await db.role.findUniqueOrThrow({ where: { key: 'THEATER_MANAGER' } });
    const key = { roleId: manager.id, permissionKey: 'rooms:create' };
    await db.rolePermission.delete({ where: { roleId_permissionKey: key } });

    try {
      denied(
        await api(managerA)
          .post(`${ADMIN}/theaters/${theaterA}/rooms`)
          .send({ code: 'A02', name: 'A' })
          .expect(403),
        'rooms:create',
      );
    } finally {
      await db.rolePermission.create({ data: key });
    }
  });

  it('refuses a permission the role lacks, but keeps its own account reachable', async () => {
    const usher = await signIn('USHER', { theaterId: theaterA });

    denied(await api(usher).post(`${ADMIN}/rooms/${roomB}/activate`).expect(403), 'rooms:activate');
    await api(usher).get(`${ADMIN}/auth/sessions`).expect(200);
  });

  it('describes the signed-in account the way the admin app reads it', async () => {
    const res = await api(managerA).get(`${ADMIN}/auth/me`).expect(200);

    expect(body(res).data).toMatchObject({
      user: { role: 'Theater manager' },
      access: {
        permissions: expect.arrayContaining(['rooms:create', 'theaters:read']) as unknown,
        scope: { type: 'theater', theaterIds: [theaterA] },
      },
    });
  });
});
