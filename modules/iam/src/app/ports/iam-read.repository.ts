import type { RoleView } from '../views';

export abstract class IamReadRepository {
  abstract listPermissions(): Promise<string[]>;

  abstract listRoles(): Promise<RoleView[]>;

  // Null for an unknown id or the customer role.
  abstract findRole(roleId: string): Promise<RoleView | null>;
}
