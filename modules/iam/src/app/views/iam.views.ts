import type { RoleScope } from '../../domain';

export type RoleView = {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  // Where the role may be granted.
  readonly scopes: readonly RoleScope[];
  readonly isSystem: boolean;
  readonly isLocked: boolean;
  readonly permissions: string[];
  // Accounts holding it now.
  readonly users: number;
};

// An internal account with its active role and where it applies.
export type EmployeeView = {
  readonly id: string;
  readonly email: string | null;
  readonly fullName: string | null;
  readonly isEmailVerified: boolean;
  readonly createdAt: Date;
  readonly deletedAt: Date | null;
  readonly role: { readonly key: string; readonly name: string };
  readonly scope: RoleScope;
  readonly clusterId: string | null;
  readonly theaterId: string | null;
};
