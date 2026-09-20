import { Inject, Injectable } from '@nestjs/common';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';
import { ROLE_REPOSITORY, type RoleRepository } from '../ports';
import { RoleNotFoundException } from '../../domain';
import { PermissionNotFoundException } from '../../domain';
import { PERMISSION_REPOSITORY, type PermissionRepository } from '../ports';

export type RevokePermissionFromRoleCommandProps = {
  readonly roleId: string;
  readonly permissionId: string;
};

export class RevokePermissionFromRoleCommand {
  constructor(readonly props: RevokePermissionFromRoleCommandProps) {}
}

@Injectable()
export class RevokePermissionFromRoleHandler {
  constructor(
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository,
  ) {}

  async execute(command: RevokePermissionFromRoleCommand): Promise<void> {
    const [role, permission] = await Promise.all([
      this.roles.findById(command.props.roleId),
      this.permissions.findById(command.props.permissionId),
    ]);
    if (!role) throw new RoleNotFoundException();
    if (!permission) throw new PermissionNotFoundException();
    role.assertCustom();
    await this.userAccess.revokePermissionFromRole(
      command.props.roleId,
      command.props.permissionId,
    );
  }
}
