import { describe, expect, it } from 'vitest';
import {
  isEmptyPlan,
  PERMISSION_KEYS,
  PERMISSIONS,
  permissionModule,
  planCatalogSync,
  SYSTEM_ROLE_KEYS,
  type StoredPermission,
} from '../../src/domain';

// The database as the sync left it: every permission of the catalog, every system role.
const synced = (): StoredPermission[] =>
  PERMISSION_KEYS.map((key) => ({
    key,
    module: permissionModule(key),
    description: PERMISSIONS[key],
    deprecated: false,
  }));

const plan = (permissions: StoredPermission[], roleKeys: string[] = SYSTEM_ROLE_KEYS) =>
  planCatalogSync({ permissions, roleKeys });

describe('planCatalogSync', () => {
  it('adds the whole catalog to an empty database and grants the defaults', () => {
    const result = plan([]);

    expect(result.add).toEqual(PERMISSION_KEYS);
    expect(result.grants.find((grant) => grant.permission === 'rooms:create')?.roles).toEqual([
      'SUPER_ADMIN',
      'CLUSTER_MANAGER',
      'THEATER_MANAGER',
    ]);
  });

  it('grants every permission to SUPER_ADMIN, even one no role has by default', () => {
    const result = plan([]);

    expect(result.grants.find((grant) => grant.permission === 'roles:assign')?.roles).toEqual([
      'SUPER_ADMIN',
    ]);
    expect(result.grants).toHaveLength(PERMISSION_KEYS.length);
  });

  it('plans nothing once the database matches the catalog', () => {
    expect(isEmptyPlan(plan(synced()))).toBe(true);
  });

  it('adds and grants only a permission the database has never seen', () => {
    const result = plan(synced().filter((permission) => permission.key !== 'seats:read'));

    expect(result.add).toEqual(['seats:read']);
    expect(result.grants).toEqual([
      {
        permission: 'seats:read',
        roles: ['SUPER_ADMIN', 'CLUSTER_MANAGER', 'THEATER_MANAGER', 'BOX_OFFICE'],
      },
    ]);
  });

  it('skips roles missing from the database', () => {
    const result = plan([], ['SUPER_ADMIN']);

    expect(result.grants.find((grant) => grant.permission === 'rooms:create')?.roles).toEqual([
      'SUPER_ADMIN',
    ]);
  });

  it('deprecates a permission gone from code, once', () => {
    const legacy = {
      key: 'legacy:report',
      module: 'legacy',
      description: 'Old',
      deprecated: false,
    };

    expect(plan([...synced(), legacy]).deprecate).toEqual(['legacy:report']);
    expect(isEmptyPlan(plan([...synced(), { ...legacy, deprecated: true }]))).toBe(true);
  });

  it('restores a permission back in code without granting it again', () => {
    const permissions = synced().map((permission) =>
      permission.key === 'seats:read' ? { ...permission, deprecated: true } : permission,
    );

    const result = plan(permissions);

    expect(result.restore).toEqual(['seats:read']);
    expect(result.add).toEqual([]);
    expect(result.grants).toEqual([]);
  });

  it('rewrites a description changed in code', () => {
    const permissions = synced().map((permission) =>
      permission.key === 'seats:read' ? { ...permission, description: 'old text' } : permission,
    );

    expect(plan(permissions).describe).toEqual(['seats:read']);
  });
});
