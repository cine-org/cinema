// The permission catalog, named like the admin UI: `resource:action`, or `resource:action.own` /
// `resource:action.any` when it matters whose data it is. Code checks these keys, so only code adds
// them; the database mirrors the catalog (synced on startup) and the admin edits who holds them.
// Only resources the backend has are listed: movies, showtimes, bookings... come with their module.
export const PERMISSIONS = {
  'users:read.own': 'View their own account',
  'users:read.any': 'View other accounts within their scope',

  'roles:read': 'View roles and their permissions',
  'roles:create': 'Create roles',
  'roles:update': 'Rename roles and edit their permissions',
  'roles:delete': 'Delete roles nobody holds',
  'roles:assign': 'Grant and revoke roles',

  'theaters:read': 'View theaters',
  'theaters:create': 'Create theaters',
  'theaters:update': 'Edit theater details',
  'theaters:activate': 'Open theaters to customers',
  'theaters:deactivate': 'Take theaters offline for a while',
  'theaters:close': 'Close theaters for good',
  'theaters:delete': 'Delete draft theaters',

  'rooms:read': 'View rooms',
  'rooms:create': 'Create rooms',
  'rooms:update': 'Edit room details',
  'rooms:activate': 'Open rooms for showtimes',
  'rooms:deactivate': 'Take rooms offline for a while',
  'rooms:close': 'Close rooms for good',
  'rooms:delete': 'Delete draft rooms',

  'room-layouts:read': 'View seat layouts',
  'room-layouts:upsert-draft': 'Edit the draft seat layout',
  'room-layouts:publish': 'Publish the draft seat layout',

  'seat-types:read': 'View seat types',
  'seat-types:create': 'Create seat types',
  'seat-types:update': 'Edit seat types',
  'seat-types:delete': 'Delete unused seat types',

  'seats:read': 'View seats',
  'seats:activate': 'Put seats back in use',
  'seats:deactivate': 'Take seats out of use',
} as const satisfies Record<string, string>;

export type PermissionKey = keyof typeof PERMISSIONS;

export const PERMISSION_KEYS = Object.keys(PERMISSIONS) as PermissionKey[];

// The resource before the colon: `theaters` for `theaters:activate`. The admin UI groups by it.
export function permissionModule(key: PermissionKey): string {
  return key.slice(0, key.indexOf(':'));
}
