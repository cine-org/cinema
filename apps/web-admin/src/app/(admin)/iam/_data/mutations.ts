import { notWired } from '@/lib/result';
import type { Permission } from './types';

// every change the IAM screens make goes through here, one function per admin api call.
// TODO: call the admin api; until then each one reports that it is not wired.

// POST roles
export const createRole = async () => notWired('creating a role');

// POST roles with the permissions of an existing role
export const duplicateRole = async (roleId: string) => notWired(`duplicating role ${roleId}`);

// PUT roles/:id/permissions with the full list the role should end up with
export const saveRolePermissions = async (roleId: string, permissions: Permission[]) =>
  notWired(`saving ${permissions.length} permissions of role ${roleId}`);
