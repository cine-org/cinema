export const PERMISSION_CODE = {
  User: {
    ReadOwn: 'user.read.own',
    UpdateOwn: 'user.update.own',
    DeleteOwn: 'user.delete.own',

    ReadAny: 'user.read.any',
    UpdateAny: 'user.update.any',
    ActivateAny: 'user.activate.any',
    DeactivateAny: 'user.deactivate.any',
    SuspendAny: 'user.suspend.any',
    DeleteAny: 'user.delete.any',

    ReadRolesAny: 'user.role.read.any',
    AssignRoleAny: 'user.role.assign.any',
    RevokeRoleAny: 'user.role.revoke.any',
    ReadPermissionsAny: 'user.permission.read.any',
  },
  Role: {
    ReadAny: 'role.read.any',
    CreateAny: 'role.create.any',
    UpdateAny: 'role.update.any',
    DeleteAny: 'role.delete.any',
    GrantPermissionAny: 'role.permission.grant.any',
    RevokePermissionAny: 'role.permission.revoke.any',
  },
  Permission: {
    ReadAny: 'permission.read.any',
    UpdateAny: 'permission.update.any',
  },
} as const;

type PermissionGroups = typeof PERMISSION_CODE;

export type PermissionCode = {
  [Group in keyof PermissionGroups]: PermissionGroups[Group][keyof PermissionGroups[Group]];
}[keyof PermissionGroups];

export const ALL_PERMISSION_CODES = Object.values(PERMISSION_CODE).flatMap((group) =>
  Object.values(group),
) as PermissionCode[];
