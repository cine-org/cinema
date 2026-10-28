import type { PermissionKey } from './permissions';

// Where a role assignment applies; mirrors the RoleScope enum of the database.
export const ROLE_SCOPE = {
  // Every theater.
  GLOBAL: 'GLOBAL',
  // The theaters of one cluster, set on the assignment.
  CLUSTER: 'CLUSTER',
  // One theater, set on the assignment.
  THEATER: 'THEATER',
  // The holder's own data only (customers).
  SELF: 'SELF',
} as const;

export type RoleScope = (typeof ROLE_SCOPE)[keyof typeof ROLE_SCOPE];

export const SYSTEM_ROLE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  CLUSTER_MANAGER: 'CLUSTER_MANAGER',
  THEATER_MANAGER: 'THEATER_MANAGER',
  BOX_OFFICE: 'BOX_OFFICE',
  USHER: 'USHER',
  CUSTOMER: 'CUSTOMER',
} as const;

export type SystemRoleKey = (typeof SYSTEM_ROLE)[keyof typeof SYSTEM_ROLE];

export type SystemRoleDefinition = {
  readonly name: string;
  // Where the role may be granted; each assignment picks one.
  readonly scopes: readonly RoleScope[];
  // Holds every permission and cannot be edited, so the system always keeps an administrator.
  readonly locked: boolean;
  // Granted when a permission is first seen, never again: later changes are the admin's.
  readonly defaultPermissions: readonly PermissionKey[];
};

// The roles of the admin UI, plus CUSTOMER. Also created by the IAM migration; the defaults follow
// the UI's mock roles, leaving out resources the backend does not have yet.
export const SYSTEM_ROLES: Record<SystemRoleKey, SystemRoleDefinition> = {
  SUPER_ADMIN: {
    name: 'Super admin',
    scopes: [ROLE_SCOPE.GLOBAL],
    locked: true,
    defaultPermissions: [],
  },
  CONTENT_MANAGER: {
    name: 'Content manager',
    scopes: [ROLE_SCOPE.GLOBAL],
    locked: false,
    defaultPermissions: [
      'users:read.own',
      'theaters:read',
      'seat-types:read',
      'seat-types:create',
      'seat-types:update',
      'seat-types:delete',
    ],
  },
  CUSTOMER_SUPPORT: {
    name: 'Customer support',
    scopes: [ROLE_SCOPE.GLOBAL, ROLE_SCOPE.CLUSTER, ROLE_SCOPE.THEATER],
    locked: false,
    defaultPermissions: ['users:read.own', 'users:read.any', 'theaters:read'],
  },
  CLUSTER_MANAGER: {
    name: 'Cluster manager',
    scopes: [ROLE_SCOPE.CLUSTER],
    locked: false,
    defaultPermissions: [
      'users:read.own',
      'users:read.any',
      'theaters:read',
      'theaters:create',
      'theaters:update',
      'theaters:activate',
      'theaters:deactivate',
      'theaters:close',
      'rooms:read',
      'rooms:create',
      'rooms:update',
      'rooms:activate',
      'rooms:deactivate',
      'rooms:close',
      'rooms:delete',
      'room-layouts:read',
      'room-layouts:upsert-draft',
      'room-layouts:publish',
      'seat-types:read',
      'seats:read',
      'seats:activate',
      'seats:deactivate',
    ],
  },
  THEATER_MANAGER: {
    name: 'Theater manager',
    scopes: [ROLE_SCOPE.THEATER],
    locked: false,
    defaultPermissions: [
      'users:read.own',
      'users:read.any',
      'theaters:read',
      'theaters:update',
      'rooms:read',
      'rooms:create',
      'rooms:update',
      'rooms:activate',
      'rooms:deactivate',
      'rooms:close',
      'room-layouts:read',
      'room-layouts:upsert-draft',
      'room-layouts:publish',
      'seat-types:read',
      'seats:read',
      'seats:activate',
      'seats:deactivate',
    ],
  },
  BOX_OFFICE: {
    name: 'Box office',
    scopes: [ROLE_SCOPE.THEATER],
    locked: false,
    defaultPermissions: [
      'users:read.own',
      'users:read.any',
      'theaters:read',
      'rooms:read',
      'room-layouts:read',
      'seat-types:read',
      'seats:read',
    ],
  },
  USHER: {
    name: 'Usher',
    scopes: [ROLE_SCOPE.THEATER],
    locked: false,
    defaultPermissions: ['users:read.own', 'theaters:read', 'rooms:read'],
  },
  CUSTOMER: {
    name: 'Customer',
    scopes: [ROLE_SCOPE.SELF],
    locked: false,
    defaultPermissions: [],
  },
};

export const SYSTEM_ROLE_KEYS = Object.keys(SYSTEM_ROLES) as SystemRoleKey[];

// System roles that receive a permission the first time it appears: locked roles always do.
export function defaultHoldersOf(permission: PermissionKey): SystemRoleKey[] {
  return SYSTEM_ROLE_KEYS.filter((key) => {
    const role = SYSTEM_ROLES[key];
    return role.locked || role.defaultPermissions.includes(permission);
  });
}
