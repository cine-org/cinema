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

type Role = { id: string; key: string; scopes: string[]; permissions: string[]; users: number };
type Employee = { id: string; scope: string; clusterId: string | null; theaterId: string | null };

// Other specs run alongside and rely on the system roles, so every permission edit here is made
// on a custom role this spec creates.
describe('Admin roles and employees (e2e)', () => {
  let app: INestApplication;
  let db: DatabaseWriteClient;
  let origin: string;
  const staff = internalAccounts(() => app);
  const roleKeys: string[] = [];
  const theaterIds: string[] = [];
  const clusterIds: string[] = [];
  let clusterX: string;
  let theaterA: string;
  let theaterB: string;
  let admin: string;
  let adminId: string;

  const api = (token?: string) => {
    const agent = request.agent(app.getHttpServer());
    return token ? agent.set('Authorization', `Bearer ${token}`) : agent;
  };
  const account = async (role: string, place: { clusterId?: string; theaterId?: string } = {}) => {
    const created = await staff.create(role, place);
    return { ...created, token: (await staff.signIn(created.email, origin)).accessToken };
  };
  const newKey = () => {
    const key = `E2E_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
    roleKeys.push(key);
    return key;
  };
  const createRole = async (scopes: string[], permissions: string[], key = newKey()) => {
    const res = await api(admin)
      .post(`${ADMIN}/roles`)
      .send({ key, name: `Role ${key}`, scopes, permissions })
      .expect(201);
    return { id: body<{ id: string }>(res).data.id, key };
  };
  const roles = async () => body<Role[]>(await api(admin).get(`${ADMIN}/roles`).expect(200)).data;
  const roleByKey = async (key: string) => (await roles()).find((role) => role.key === key)!;
  const employees = async (token: string) =>
    body<Employee[]>(
      await api(token).get(`${ADMIN}/users`).query({ type: 'employee', limit: 100 }).expect(200),
    ).data;

  async function theater(name: string, clusterId: string | null) {
    const created = await db.theater.create({
      data: {
        clusterId,
        name,
        slug: `roles-${crypto.randomUUID().slice(0, 8)}`,
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

    clusterX = (await db.cluster.create({ data: { name: `Roles ${crypto.randomUUID()}` } })).id;
    clusterIds.push(clusterX);
    theaterA = await theater('Roles A', clusterX);
    theaterB = await theater('Roles B', null);
    const superAdmin = await account('SUPER_ADMIN');
    admin = superAdmin.token;
    adminId = superAdmin.id;
  });

  // Sign-ins are rate limited per IP.
  beforeEach(() => app.get(CacheClient).flushdb());

  afterAll(async () => {
    try {
      await staff.cleanup();
      await db.role.deleteMany({ where: { key: { in: roleKeys } } });
      await db.theater.deleteMany({ where: { id: { in: theaterIds } } });
      await db.cluster.deleteMany({ where: { id: { in: clusterIds } } });
    } finally {
      await app.close();
    }
  });

  it('lists the catalog as keys and the roles, system roles first', async () => {
    const permissions = body<string[]>(await api(admin).get(`${ADMIN}/permissions`).expect(200));
    expect(permissions.data).toEqual(expect.arrayContaining(['roles:read', 'theaters:read']));

    expect((await roles()).slice(0, 8).map((role) => role.key)).toEqual([
      'SUPER_ADMIN',
      'CONTENT_MANAGER',
      'CUSTOMER_SUPPORT',
      'CLUSTER_MANAGER',
      'THEATER_MANAGER',
      'BOX_OFFICE',
      'USHER',
      'CUSTOMER',
    ]);
  });

  it('needs roles:read to see roles', async () => {
    const { token } = await account('USHER', { theaterId: theaterA });

    const res = await api(token).get(`${ADMIN}/roles`).expect(403);

    expect(body(res)).toMatchObject({
      code: 'IAM.PERMISSION_DENIED',
      errors: [{ code: 'roles:read' }],
    });
  });

  it('creates a custom role, or a copy of a role from its permissions', async () => {
    const usher = await roleByKey('USHER');

    const copy = await createRole(usher.scopes, usher.permissions);

    expect(await roleByKey(copy.key)).toMatchObject({
      scopes: ['THEATER'],
      permissions: usher.permissions,
      users: 0,
    });
    const taken = await api(admin)
      .post(`${ADMIN}/roles`)
      .send({ key: copy.key, name: 'Again', scopes: ['GLOBAL'], permissions: [] })
      .expect(409);
    expect(body(taken).code).toBe('IAM.ROLE_KEY_TAKEN');
  });

  it('refuses a system role key, a customer scope and unknown permissions', async () => {
    const send = (payload: Record<string, unknown>) =>
      api(admin)
        .post(`${ADMIN}/roles`)
        .send({ key: newKey(), name: 'Bad', scopes: ['GLOBAL'], permissions: [], ...payload });

    expect(body(await send({ key: 'USHER' }).expect(400)).code).toBe('IAM.INVALID_ROLE');
    expect((await send({ scopes: ['SELF'] }).expect(400)).status).toBe(400);
    expect(body(await send({ permissions: ['theaters:fly'] }).expect(400)).code).toBe(
      'IAM.UNKNOWN_PERMISSION',
    );
  });

  it('applies new permissions to the holders on their next request', async () => {
    const role = await createRole(['THEATER'], ['theaters:read']);
    const holder = await account(role.key, { theaterId: theaterA });
    await api(holder.token).get(`${ADMIN}/theaters/${theaterA}`).expect(200);

    const res = await api(admin)
      .put(`${ADMIN}/roles/${role.id}/permissions`)
      .send({ permissions: ['rooms:read'] })
      .expect(200);

    expect(body(res).data).toEqual({ added: ['rooms:read'], removed: ['theaters:read'] });
    await api(holder.token).get(`${ADMIN}/theaters/${theaterA}`).expect(403);
  });

  it('keeps SUPER_ADMIN locked and nobody edits their own role', async () => {
    const editor = await createRole(['GLOBAL'], ['roles:read', 'roles:update']);
    const { token } = await account(editor.key);

    const locked = await api(token)
      .put(`${ADMIN}/roles/${(await roleByKey('SUPER_ADMIN')).id}/permissions`)
      .send({ permissions: [] })
      .expect(409);
    expect(body(locked).code).toBe('IAM.ROLE_LOCKED');

    const own = await api(token)
      .put(`${ADMIN}/roles/${editor.id}/permissions`)
      .send({ permissions: ['roles:read'] })
      .expect(403);
    expect(body(own).code).toBe('IAM.SELF_ROLE_CHANGE');
  });

  it('lists employees within the caller’s clusters and theaters', async () => {
    const usherA = await account('USHER', { theaterId: theaterA });
    const usherB = await account('USHER', { theaterId: theaterB });
    const clusterManager = await account('CLUSTER_MANAGER', { clusterId: clusterX });
    const managerA = await account('THEATER_MANAGER', { theaterId: theaterA });

    const all = (await employees(admin)).map((e) => e.id);
    expect(all).toEqual(expect.arrayContaining([usherA.id, usherB.id, clusterManager.id]));

    const ofCluster = (await employees(clusterManager.token)).map((e) => e.id);
    expect(ofCluster).toEqual(expect.arrayContaining([usherA.id, clusterManager.id, managerA.id]));
    expect(ofCluster).not.toContain(usherB.id);

    const ofTheater = await employees(managerA.token);
    expect(ofTheater.every((e) => e.theaterId === theaterA)).toBe(true);
  });

  it('changes a role and its place in one step, keeping the old grant', async () => {
    const target = await account('USHER', { theaterId: theaterA });

    await api(admin)
      .patch(`${ADMIN}/users/${target.id}`)
      .send({ role: 'CLUSTER_MANAGER', scope: 'CLUSTER', clusterId: clusterX })
      .expect(200);

    const grants = await db.roleAssignment.findMany({
      where: { userId: target.id },
      orderBy: { createdAt: 'asc' },
      select: { scope: true, revokedById: true, grantedById: true, revokedAt: true },
    });
    expect(grants).toMatchObject([
      { scope: 'THEATER', revokedById: adminId },
      { scope: 'CLUSTER', grantedById: adminId, revokedAt: null },
    ]);
    // The old token now carries the new grant.
    await api(target.token).get(`${ADMIN}/theaters/${theaterA}`).expect(200);
  });

  it('refuses changing one’s own role, a customer, or a scope the role forbids', async () => {
    const customer = await db.user.create({
      data: {
        email: `customer-${crypto.randomUUID().slice(0, 8)}@cinema.local`,
        passwordHash: 'not-used',
        roleAssignments: { create: { role: { connect: { key: 'CUSTOMER' } }, scope: 'SELF' } },
      },
    });
    const usher = await account('USHER', { theaterId: theaterA });

    try {
      const own = await api(admin)
        .patch(`${ADMIN}/users/${adminId}`)
        .send({ role: 'CONTENT_MANAGER', scope: 'GLOBAL' })
        .expect(403);
      expect(body(own).code).toBe('IAM.SELF_ROLE_CHANGE');

      const ofCustomer = await api(admin)
        .patch(`${ADMIN}/users/${customer.id}`)
        .send({ role: 'CONTENT_MANAGER', scope: 'GLOBAL' })
        .expect(409);
      expect(body(ofCustomer).code).toBe('IAM.CUSTOMER_ACCOUNT');

      const mismatch = await api(admin)
        .patch(`${ADMIN}/users/${usher.id}`)
        .send({ role: 'USHER', scope: 'GLOBAL' })
        .expect(400);
      expect(body(mismatch).code).toBe('IAM.ROLE_SCOPE_MISMATCH');
    } finally {
      await db.user.delete({ where: { id: customer.id } });
    }
  });
});
