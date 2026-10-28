import { Test, type TestingModule } from '@nestjs/testing';
import { DatabaseModule, DatabaseWriteClient } from '@repo/database';
import {
  IamModule,
  PERMISSION_KEYS,
  SYSTEM_ROLES,
  SyncPermissionCatalogCommand,
  SyncPermissionCatalogHandler,
} from '@repo/iam';
import { ConfigModule, ConfigService } from '@/config';

describe('Permission catalog sync (int)', () => {
  let moduleRef: TestingModule;
  let db: DatabaseWriteClient;
  let sync: () => ReturnType<SyncPermissionCatalogHandler['execute']>;

  const permissionsOf = async (roleKey: string) =>
    (
      await db.rolePermission.findMany({
        where: { role: { key: roleKey } },
        select: { permissionKey: true },
      })
    )
      .map((row) => row.permissionKey)
      .sort();

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule,
        DatabaseModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => ({ url: config.db.url }),
        }),
        IamModule,
      ],
    }).compile();
    // Runs the startup sync.
    await moduleRef.init();
    db = moduleRef.get(DatabaseWriteClient);
    const handler = moduleRef.get(SyncPermissionCatalogHandler);
    sync = () => handler.execute(new SyncPermissionCatalogCommand());
  });

  afterAll(() => moduleRef.close());

  it('holds the catalog and the default permissions after startup', async () => {
    const keys = (await db.permission.findMany({ where: { deprecatedAt: null } })).map(
      (permission) => permission.key,
    );

    expect(keys.sort()).toEqual([...PERMISSION_KEYS].sort());
    expect(await permissionsOf('SUPER_ADMIN')).toEqual([...PERMISSION_KEYS].sort());
    expect(await permissionsOf('THEATER_MANAGER')).toEqual(
      [...SYSTEM_ROLES.THEATER_MANAGER.defaultPermissions].sort(),
    );
    expect(await permissionsOf('CUSTOMER')).toEqual([]);
  });

  it('changes nothing when run again', async () => {
    const plan = await sync();

    expect(plan.add).toEqual([]);
    expect(plan.grants).toEqual([]);
  });

  it("keeps an admin's edit across syncs", async () => {
    const manager = await db.role.findUniqueOrThrow({ where: { key: 'THEATER_MANAGER' } });
    const key = { roleId: manager.id, permissionKey: 'rooms:create' };
    await db.rolePermission.delete({ where: { roleId_permissionKey: key } });

    try {
      await sync();

      expect(await permissionsOf('THEATER_MANAGER')).not.toContain('rooms:create');
    } finally {
      await db.rolePermission.create({ data: key });
    }
  });

  it('grants a permission seen for the first time to its default roles only', async () => {
    // As if seats:read were new in code: gone from the database entirely.
    await db.rolePermission.deleteMany({ where: { permissionKey: 'seats:read' } });
    await db.permission.delete({ where: { key: 'seats:read' } });

    const plan = await sync();

    expect(plan.add).toEqual(['seats:read']);
    const holders = await db.rolePermission.findMany({
      where: { permissionKey: 'seats:read' },
      select: { role: { select: { key: true } } },
    });
    expect(holders.map((row) => row.role.key).sort()).toEqual([
      'BOX_OFFICE',
      'CLUSTER_MANAGER',
      'SUPER_ADMIN',
      'THEATER_MANAGER',
    ]);
  });

  it('deprecates a permission dropped from code and keeps its grants', async () => {
    const admin = await db.role.findUniqueOrThrow({ where: { key: 'SUPER_ADMIN' } });
    await db.permission.create({
      data: {
        key: 'legacy:report',
        module: 'legacy',
        description: 'Old',
        roles: { create: { roleId: admin.id } },
      },
    });

    try {
      await sync();

      const legacy = await db.permission.findUniqueOrThrow({ where: { key: 'legacy:report' } });
      expect(legacy.deprecatedAt).toBeInstanceOf(Date);
      expect(await db.rolePermission.count({ where: { permissionKey: 'legacy:report' } })).toBe(1);
    } finally {
      await db.rolePermission.deleteMany({ where: { permissionKey: 'legacy:report' } });
      await db.permission.delete({ where: { key: 'legacy:report' } });
    }
  });

  it('serializes concurrent syncs', async () => {
    await expect(Promise.all([sync(), sync(), sync()])).resolves.toHaveLength(3);
    expect(await db.permission.count({ where: { deprecatedAt: null } })).toBe(
      PERMISSION_KEYS.length,
    );
  });
});
