import { PERMISSION_KEYS, PERMISSIONS, permissionModule, type PermissionKey } from '../permissions';
import { defaultHoldersOf, type SystemRoleKey } from '../roles';

export type StoredPermission = {
  readonly key: string;
  readonly module: string;
  readonly description: string;
  readonly deprecated: boolean;
};

export type StoredCatalog = {
  readonly permissions: readonly StoredPermission[];
  readonly roleKeys: readonly string[];
};

export type CatalogSyncPlan = {
  // In code, not in the database: inserted and granted to their default roles.
  readonly add: PermissionKey[];
  // Back in code after being deprecated: undeprecated, not granted again.
  readonly restore: PermissionKey[];
  // In the database, gone from code: hidden, kept so role_permissions still point at it.
  readonly deprecate: string[];
  // Module or description changed in code.
  readonly describe: PermissionKey[];
  // Roles that receive the added permissions.
  readonly grants: { permission: PermissionKey; roles: SystemRoleKey[] }[];
};

// Code only seeds: a permission is granted by default once, when it first appears. Everything that
// is already in the database, including what an admin edited, is left alone.
export function planCatalogSync(stored: StoredCatalog): CatalogSyncPlan {
  const byKey = new Map(stored.permissions.map((permission) => [permission.key, permission]));
  const known = new Set<string>(PERMISSION_KEYS);
  const roles = new Set(stored.roleKeys);

  const add = PERMISSION_KEYS.filter((key) => !byKey.has(key));
  const restore = PERMISSION_KEYS.filter((key) => byKey.get(key)?.deprecated === true);
  const deprecate = stored.permissions
    .filter((permission) => !known.has(permission.key) && !permission.deprecated)
    .map((permission) => permission.key);
  const describe = PERMISSION_KEYS.filter((key) => {
    const current = byKey.get(key);
    return (
      current !== undefined &&
      (current.module !== permissionModule(key) || current.description !== PERMISSIONS[key])
    );
  });

  const grants = add
    .map((permission) => ({
      permission,
      roles: defaultHoldersOf(permission).filter((key) => roles.has(key)),
    }))
    .filter((grant) => grant.roles.length > 0);

  return { add, restore, deprecate, describe, grants };
}

export function isEmptyPlan(plan: CatalogSyncPlan): boolean {
  return (
    plan.add.length === 0 &&
    plan.restore.length === 0 &&
    plan.deprecate.length === 0 &&
    plan.describe.length === 0
  );
}
