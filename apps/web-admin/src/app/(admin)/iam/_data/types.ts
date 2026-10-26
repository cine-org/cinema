import type { EmployeeRole } from '@/lib/roles';

// "resource:action" or "resource:action.scope"; the api serves the full list
export type Permission = string;

export type RoleInfo = { id: EmployeeRole; users: number; permissions: readonly Permission[] };
