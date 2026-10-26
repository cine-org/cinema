import { notWired } from '@/lib/result';
import type { EmployeeRole, EmployeeScope } from '@/lib/roles';
import type { UserStatus } from './user';

// every change the users screens make goes through here, one function per admin api call.
// TODO: call the admin api; until then each one reports that it is not wired.

export type UserPatch = {
  status?: UserStatus;
  isEmailVerified?: boolean;
  role?: EmployeeRole;
  scope?: EmployeeScope;
};

// PATCH users/:id
export const updateUser = async (id: string, patch: UserPatch) =>
  notWired(`saving user ${id} (${Object.keys(patch).join(', ')})`);

// DELETE users/:id is a soft delete
export const deleteUser = async (id: string) => notWired(`deleting user ${id}`);

// POST users/:id/restore
export const restoreUser = async (id: string) => notWired(`restoring user ${id}`);
