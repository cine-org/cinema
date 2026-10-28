import type { RoleScope } from '../../domain';

export type RoleView = {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly scopes: RoleScope[];
  readonly isSystem: boolean;
  readonly isLocked: boolean;
  // Not deprecated, sorted.
  readonly permissions: string[];
  // Accounts holding the role now.
  readonly users: number;
};
