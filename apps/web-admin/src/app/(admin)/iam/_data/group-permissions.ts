import type { Permission } from './types';

export type PermissionGroup = { resource: string; ids: Permission[] };

// ids look like "resource:action" or "resource:action.scope"; groups follow the order they arrive in
export const groupPermissions = (ids: readonly Permission[]): PermissionGroup[] => {
  const groups = new Map<string, PermissionGroup>();
  for (const id of ids) {
    const resource = id.split(':')[0];
    const group = groups.get(resource) ?? { resource, ids: [] };
    group.ids.push(id);
    groups.set(resource, group);
  }
  return [...groups.values()];
};

// what the badge shows: the id without its resource
export const actionOf = (id: Permission) => id.slice(id.indexOf(':') + 1);
