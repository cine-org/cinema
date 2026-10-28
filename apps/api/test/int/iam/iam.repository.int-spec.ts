import { Test, type TestingModule } from '@nestjs/testing';
import { DatabaseModule, DatabaseWriteClient } from '@repo/database';
import {
  ChangeUserRoleCommand,
  ChangeUserRoleHandler,
  CreateRoleCommand,
  CreateRoleHandler,
  GetAccessGrantHandler,
  GetAccessGrantQuery,
  GetRoleHandler,
  GetRoleQuery,
  IamModule,
  ListPermissionsHandler,
  ListPermissionsQuery,
  ListRolesHandler,
  ListRolesQuery,
  ReplaceRolePermissionsCommand,
  ReplaceRolePermissionsHandler,
  RoleAssignmentRepository,
  RoleKeyTakenException,
  RoleNotFoundException,
  type CurrentRole,
  type RoleScope,
} from '@repo/iam';
import { ConfigModule, ConfigService } from '@/config';

type Place = { scope: RoleScope; clusterId?: string; theaterId?: string };

// The IAM handlers on their real repositories, against the test database.
describe('IAM repositories (int)', () => {
  let moduleRef: TestingModule;
  let db: DatabaseWriteClient;
  const userIds: string[] = [];
  const roleKeys: string[] = [];
  const permissionKeys: string[] = [];
  let clusterId: string;
  let theaterId: string;
  let closedTheaterId: string;

  const suffix = () => crypto.randomUUID().slice(0, 8);
  const roleKey = () => {
    const key = `INT_${suffix().toUpperCase()}`;
    roleKeys.push(key);
    return key;
  };

  async function account(role: string | null, place: Place = { scope: 'GLOBAL' }) {
    const user = await db.user.create({
      data: { email: `iam-${suffix()}@cinema.local`, passwordHash: 'hash' },
    });
    userIds.push(user.id);
    if (role) {
      await db.roleAssignment.create({
        data: {
          userId: user.id,
          roleId: (await db.role.findUniqueOrThrow({ where: { key: role } })).id,
          scope: place.scope,
          clusterId: place.clusterId ?? null,
          theaterId: place.theaterId ?? null,
        },
      });
    }
    return user.id;
  }

  const handler = <T>(type: new (...args: never[]) => T) => moduleRef.get(type);

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        DatabaseModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({ url: config.db.url }),
        }),
        IamModule,
      ],
    }).compile();
    // Syncs the permission catalog, as the API does on startup.
    await moduleRef.init();
    db = moduleRef.get(DatabaseWriteClient);

    clusterId = (await db.cluster.create({ data: { name: `Int ${suffix()}` } })).id;
    const theater = (status: 'DRAFT' | 'CLOSED') =>
      db.theater.create({
        data: {
          name: 'Int IAM',
          slug: `int-iam-${suffix()}`,
          streetAddress: '1 Test Street',
          ward: 'Ward 1',
          province: 'Ho Chi Minh',
          clusterId,
          status,
        },
      });
    theaterId = (await theater('DRAFT')).id;
    closedTheaterId = (await theater('CLOSED')).id;
  });

  afterAll(async () => {
    await db.user.deleteMany({ where: { id: { in: userIds } } });
    await db.role.deleteMany({ where: { key: { in: roleKeys } } });
    await db.permission.deleteMany({ where: { key: { in: permissionKeys } } });
    await db.theater.deleteMany({ where: { clusterId } });
    await db.cluster.deleteMany({ where: { id: clusterId } });
    await moduleRef.close();
  });

  describe('access grant', () => {
    const grantOf = (accountId: string) =>
      handler(GetAccessGrantHandler).execute(new GetAccessGrantQuery(accountId));

    it("reads the active role, its place and the role's permissions", async () => {
      const accountId = await account('USHER', { scope: 'THEATER', theaterId });

      const grant = await grantOf(accountId);

      expect(grant).toMatchObject({
        roleKey: 'USHER',
        scope: 'THEATER',
        clusterId: null,
        theaterId,
      });
      expect([...grant!.permissions].sort()).toEqual(
        (await db.rolePermission.findMany({ where: { role: { key: 'USHER' } } }))
          .map((row) => row.permissionKey)
          .sort(),
      );
    });

    it('leaves out deprecated permissions', async () => {
      const key = roleKey();
      const deprecated = `int:${suffix()}`;
      permissionKeys.push(deprecated);
      await db.permission.create({
        data: { key: deprecated, module: 'int', description: 'Int', deprecatedAt: new Date() },
      });
      await db.role.create({
        data: {
          key,
          name: 'Int',
          scopes: ['GLOBAL'],
          permissions: {
            createMany: {
              data: [{ permissionKey: 'theaters:read' }, { permissionKey: deprecated }],
            },
          },
        },
      });
      const accountId = await account(key);

      expect([...(await grantOf(accountId))!.permissions]).toEqual(['theaters:read']);
    });

    it('finds nothing for a revoked role or a deleted account', async () => {
      const revoked = await account('USHER', { scope: 'THEATER', theaterId });
      await db.roleAssignment.updateMany({
        where: { userId: revoked },
        data: { revokedAt: new Date() },
      });
      const deleted = await account('CONTENT_MANAGER');
      await db.user.update({ where: { id: deleted }, data: { deletedAt: new Date() } });

      expect(await grantOf(revoked)).toBeNull();
      expect(await grantOf(deleted)).toBeNull();
    });
  });

  describe('roles', () => {
    const create = (key: string, permissions = ['theaters:read']) =>
      handler(CreateRoleHandler).execute(
        new CreateRoleCommand(key, 'Int role', ['THEATER'], permissions),
      );

    it('creates a role readable with its permissions and no holder', async () => {
      const key = roleKey();
      const { roleId } = await create(key, ['rooms:read', 'theaters:read']);

      expect(await handler(GetRoleHandler).execute(new GetRoleQuery(roleId))).toEqual({
        id: roleId,
        key,
        name: 'Int role',
        scopes: ['THEATER'],
        isSystem: false,
        isLocked: false,
        permissions: ['rooms:read', 'theaters:read'],
        users: 0,
      });
    });

    it('refuses a key another role has', async () => {
      const key = roleKey();
      await create(key);

      await expect(create(key)).rejects.toThrow(RoleKeyTakenException);
    });

    it('replaces permissions and only touches what changed', async () => {
      const { roleId } = await create(roleKey(), ['theaters:read', 'rooms:read']);
      const kept = await db.rolePermission.findUniqueOrThrow({
        where: { roleId_permissionKey: { roleId, permissionKey: 'rooms:read' } },
      });
      const admin = await account('SUPER_ADMIN');

      const change = await handler(ReplaceRolePermissionsHandler).execute(
        new ReplaceRolePermissionsCommand(admin, roleId, ['rooms:read', 'rooms:create']),
      );

      expect(change).toEqual({ added: ['rooms:create'], removed: ['theaters:read'] });
      const rows = await db.rolePermission.findMany({ where: { roleId } });
      expect(rows.map((row) => row.permissionKey).sort()).toEqual(['rooms:create', 'rooms:read']);
      // Unchanged rows are not rewritten.
      expect(rows.find((row) => row.permissionKey === 'rooms:read')?.createdAt).toEqual(
        kept.createdAt,
      );
    });

    it('hides the customer role from reads and edits', async () => {
      const customer = await db.role.findUniqueOrThrow({ where: { key: 'CUSTOMER' } });
      const admin = await account('SUPER_ADMIN');

      const roles = await handler(ListRolesHandler).execute(new ListRolesQuery());
      expect(roles.map((role) => role.key)).not.toContain('CUSTOMER');
      await expect(handler(GetRoleHandler).execute(new GetRoleQuery(customer.id))).rejects.toThrow(
        RoleNotFoundException,
      );
      await expect(
        handler(ReplaceRolePermissionsHandler).execute(
          new ReplaceRolePermissionsCommand(admin, customer.id, ['theaters:read']),
        ),
      ).rejects.toThrow(RoleNotFoundException);
    });

    it('lists system roles first and counts active holders only', async () => {
      const key = roleKey();
      await create(key);
      const holder = await account(key, { scope: 'THEATER', theaterId });
      await account(key, { scope: 'THEATER', theaterId }).then((id) =>
        db.roleAssignment.updateMany({ where: { userId: id }, data: { revokedAt: new Date() } }),
      );

      const roles = await handler(ListRolesHandler).execute(new ListRolesQuery());

      const firstCustom = roles.findIndex((role) => !role.isSystem);
      expect(roles.slice(0, firstCustom).every((role) => role.isSystem)).toBe(true);
      expect(roles.find((role) => role.key === key)?.users).toBe(1);
      expect(holder).toBeDefined();
    });

    it('lists the catalog without deprecated permissions', async () => {
      const permissions = await handler(ListPermissionsHandler).execute(new ListPermissionsQuery());

      expect(permissions).toContain('rooms:create');
      expect(permissions).toEqual([...permissions].sort());
      expect(permissions.some((key) => key.startsWith('int:'))).toBe(false);
    });
  });

  describe('role changes', () => {
    const change = (actorId: string, accountId: string, role: string, place: Place) =>
      handler(ChangeUserRoleHandler).execute(
        new ChangeUserRoleCommand(
          actorId,
          accountId,
          role,
          place.scope,
          place.clusterId ?? null,
          place.theaterId ?? null,
        ),
      );

    it('revokes the old grant, keeps it as history and grants the new one', async () => {
      const admin = await account('SUPER_ADMIN');
      const staff = await account('USHER', { scope: 'THEATER', theaterId });

      await change(admin, staff, 'CLUSTER_MANAGER', { scope: 'CLUSTER', clusterId });

      const rows = await db.roleAssignment.findMany({
        where: { userId: staff },
        include: { role: true },
        orderBy: { createdAt: 'asc' },
      });
      expect(rows.map((row) => [row.role.key, row.revokedById, row.grantedById])).toEqual([
        ['USHER', admin, null],
        ['CLUSTER_MANAGER', null, admin],
      ]);
      expect(rows[0]!.revokedAt).not.toBeNull();
      expect(rows[1]).toMatchObject({ scope: 'CLUSTER', clusterId, revokedAt: null });
    });

    it('refuses a closed theater, a customer account and an unknown account', async () => {
      const admin = await account('SUPER_ADMIN');
      const staff = await account('USHER', { scope: 'THEATER', theaterId });
      const customer = await account('CUSTOMER', { scope: 'SELF' });

      await expect(
        change(admin, staff, 'USHER', { scope: 'THEATER', theaterId: closedTheaterId }),
      ).rejects.toThrow(/Theater not available/);
      await expect(
        change(admin, customer, 'USHER', { scope: 'THEATER', theaterId }),
      ).rejects.toThrow(/Customer accounts/);
      await expect(
        change(admin, crypto.randomUUID(), 'USHER', { scope: 'THEATER', theaterId }),
      ).rejects.toThrow(/Account not found/);
    });

    it('counts the other active SUPER_ADMINs when one would leave the role', async () => {
      const admin = await account('SUPER_ADMIN');
      const leaving = await account('SUPER_ADMIN');
      const others = await db.roleAssignment.count({
        where: {
          revokedAt: null,
          role: { key: 'SUPER_ADMIN' },
          userId: { not: leaving },
          user: { deletedAt: null },
        },
      });
      const seen: CurrentRole[] = [];

      await moduleRef.get(RoleAssignmentRepository).changeRole(
        {
          accountId: leaving,
          actorId: admin,
          role: await db.role.findUniqueOrThrow({
            where: { key: 'CONTENT_MANAGER' },
            select: { id: true, key: true, scopes: true },
          }),
          scope: 'GLOBAL',
          clusterId: null,
          theaterId: null,
        },
        (current) => seen.push(current),
      );

      expect(seen).toEqual([{ roleKey: 'SUPER_ADMIN', otherAdmins: others }]);
    });
  });
});
