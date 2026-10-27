import { Test, type TestingModule } from '@nestjs/testing';
import { DatabaseModule, DatabaseWriteClient } from '@repo/database';
import { ConfigModule, ConfigService } from '@/config';

type Place = {
  scope: 'GLOBAL' | 'CLUSTER' | 'THEATER' | 'SELF';
  clusterId?: string;
  theaterId?: string;
};

// The rules the IAM migration puts in the database itself, whatever code writes the rows.
describe('Role assignments (int)', () => {
  let moduleRef: TestingModule;
  let db: DatabaseWriteClient;
  const userIds: string[] = [];
  const theaterIds: string[] = [];
  const clusterIds: string[] = [];
  const roleIds: string[] = [];
  let theaterId: string;
  let clusterId: string;

  const suffix = () => crypto.randomUUID().slice(0, 8);

  async function user(): Promise<string> {
    const created = await db.user.create({
      data: { email: `iam-${suffix()}@cinema.local`, passwordHash: 'hash' },
    });
    userIds.push(created.id);
    return created.id;
  }

  const assign = (userId: string, role: string, place: Place) =>
    db.roleAssignment.create({
      data: {
        user: { connect: { id: userId } },
        role: { connect: { key: role } },
        scope: place.scope,
        ...(place.clusterId ? { cluster: { connect: { id: place.clusterId } } } : {}),
        ...(place.theaterId ? { theater: { connect: { id: place.theaterId } } } : {}),
      },
    });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({ url: config.db.url }),
        }),
      ],
    }).compile();
    db = moduleRef.get(DatabaseWriteClient);

    clusterId = (await db.cluster.create({ data: { name: `Int ${suffix()}` } })).id;
    clusterIds.push(clusterId);
    theaterId = (
      await db.theater.create({
        data: {
          name: 'Int IAM',
          slug: `int-iam-${suffix()}`,
          streetAddress: '1 Test Street',
          ward: 'Ward 1',
          province: 'Ho Chi Minh',
          clusterId,
        },
      })
    ).id;
    theaterIds.push(theaterId);
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.role.deleteMany({ where: { id: { in: roleIds } } });
    await db.theater.deleteMany({ where: { id: { in: theaterIds } } });
    await db.cluster.deleteMany({ where: { id: { in: clusterIds } } });
    await moduleRef.close();
  });

  it('allows one active role per account', async () => {
    const userId = await user();
    await assign(userId, 'USHER', { scope: 'THEATER', theaterId });

    await expect(assign(userId, 'CONTENT_MANAGER', { scope: 'GLOBAL' })).rejects.toThrow(
      /Unique constraint/,
    );
  });

  it('allows a new role once the previous one is revoked, and keeps the history', async () => {
    const userId = await user();
    const first = await assign(userId, 'USHER', { scope: 'THEATER', theaterId });
    await db.roleAssignment.update({ where: { id: first.id }, data: { revokedAt: new Date() } });

    await assign(userId, 'CLUSTER_MANAGER', { scope: 'CLUSTER', clusterId });

    expect(await db.roleAssignment.count({ where: { userId } })).toBe(2);
  });

  it.each<[string, string, () => Place]>([
    ['THEATER without a theater', 'USHER', () => ({ scope: 'THEATER' })],
    ['CLUSTER without a cluster', 'CLUSTER_MANAGER', () => ({ scope: 'CLUSTER' })],
    ['GLOBAL with a theater', 'CONTENT_MANAGER', () => ({ scope: 'GLOBAL', theaterId })],
    ['THEATER with a cluster too', 'USHER', () => ({ scope: 'THEATER', theaterId, clusterId })],
  ])('refuses an assignment %s', async (_, role, place) => {
    const userId = await user();

    await expect(assign(userId, role, place())).rejects.toThrow(
      /role_assignments_scope_target_check/,
    );
  });

  it('cannot delete a role, a theater or a cluster someone holds a role in', async () => {
    const role = await db.role.create({
      data: { key: `INT_${suffix().toUpperCase()}`, name: 'Int', scopes: ['THEATER'] },
    });
    roleIds.push(role.id);
    const userId = await user();
    await assign(userId, role.key, { scope: 'THEATER', theaterId });

    await expect(db.role.delete({ where: { id: role.id } })).rejects.toThrow();
    await expect(db.theater.delete({ where: { id: theaterId } })).rejects.toThrow();
    await expect(db.cluster.delete({ where: { id: clusterId } })).rejects.toThrow();
  });
});
