import { Inject, Injectable } from '@nestjs/common';
import { PermissionNotFoundException, RoleNotFoundException } from '../../domain';
import {
  PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  USER_ACCESS_REPOSITORY,
  type PermissionRepository,
  type RoleRepository,
  type UserAccessRepository,
} from '../ports';

export type GrantPermissionToRoleCommandProps = {
  readonly roleId: string;
  readonly permissionId: string;
};

export class GrantPermissionToRoleCommand {
  constructor(readonly props: GrantPermissionToRoleCommandProps) {}
}

@Injectable()
export class GrantPermissionToRoleHandler {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository,
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
  ) {}

  async execute(command: GrantPermissionToRoleCommand): Promise<void> {
    const [role, permission] = await Promise.all([
      this.roles.findById(command.props.roleId),
      this.permissions.findById(command.props.permissionId),
    ]);

    if (!role) {
      throw new RoleNotFoundException();
    }

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    role.assertCustom();

    await this.userAccess.grantPermissionToRole(role.id, permission.id);
  }
}
