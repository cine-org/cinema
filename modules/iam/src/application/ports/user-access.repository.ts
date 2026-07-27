import type { Permission, Role } from '../../domain';

export const USER_ACCESS_REPOSITORY = Symbol('USER_ACCESS_REPOSITORY');

export interface UserAccessRepository {
  assignRoleToUser(userId: string, roleId: string): Promise<void>;
  revokeRoleFromUser(userId: string, roleId: string): Promise<void>;
  grantPermissionToRole(roleId: string, permissionId: string): Promise<void>;
  revokePermissionFromRole(roleId: string, permissionId: string): Promise<void>;
  getUserRoles(userId: string): Promise<Role[]>;
  getUserPermissions(userId: string): Promise<Permission[]>;
  userHasPermission(userId: string, permissionCode: string): Promise<boolean>;
}
