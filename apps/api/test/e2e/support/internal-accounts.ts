import type { INestApplication } from '@nestjs/common';
import { PasswordHasher } from '@repo/auth';
import { DatabaseWriteClient } from '@repo/database';
import request from 'supertest';

export const INTERNAL_PASSWORD = 'internal-password-1';

// Internal accounts come by invitation, which these tests skip: the account is written directly,
// with a real password hash, and every one created here is deleted by `cleanup`.
export function internalAccounts(app: () => INestApplication) {
  const ids: string[] = [];

  // Granted GLOBAL, or at the cluster or theater given.
  async function create(role: string, place: { clusterId?: string; theaterId?: string } = {}) {
    const db = app().get(DatabaseWriteClient);
    const id = crypto.randomUUID();
    const email = `staff-${id.slice(0, 8)}@cinema.local`;
    await db.user.create({
      data: {
        id,
        email,
        passwordHash: await app().get(PasswordHasher).hash(INTERNAL_PASSWORD),
        isEmailVerified: true,
        roleAssignments: {
          create: {
            role: { connect: { key: role } },
            scope: place.theaterId ? 'THEATER' : place.clusterId ? 'CLUSTER' : 'GLOBAL',
            ...(place.clusterId ? { cluster: { connect: { id: place.clusterId } } } : {}),
            ...(place.theaterId ? { theater: { connect: { id: place.theaterId } } } : {}),
          },
        },
      },
    });
    ids.push(id);
    return { id, email };
  }

  // Signs in on the admin side; returns the access token and an agent holding the refresh cookie.
  async function signIn(email: string, origin: string) {
    const agent = request.agent(app().getHttpServer());
    const res = await agent
      .post('/api/v1/admin/auth/login')
      .set('Origin', origin)
      .send({ email, password: INTERNAL_PASSWORD })
      .expect(200);
    return {
      agent,
      res,
      accessToken: (res.body as { data: { accessToken: string } }).data.accessToken,
    };
  }

  async function cleanup() {
    await app()
      .get(DatabaseWriteClient)
      .user.deleteMany({ where: { id: { in: ids } } });
  }

  return { create, signIn, cleanup };
}
