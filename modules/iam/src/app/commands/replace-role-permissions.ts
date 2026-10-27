import { Injectable } from '@nestjs/common';
import {
  RoleNotFoundException,
  SelfRoleChangeException,
  type PermissionChange,
} from '../../domain';
import { RoleRepository } from '../ports';

export type ReplaceRolePermissionsCommandProps = {
  // The role the caller holds: nobody edits the permissions of their own role.
  readonly actorRoleKey: string;
  readonly roleId: string;
  // The whole new set.
  readonly permissions: readonly string[];
};

export class ReplaceRolePermissionsCommand {
  constructor(readonly props: ReplaceRolePermissionsCommandProps) {}
}

// The holders of the role get the new permissions on their next request.
@Injectable()
export class ReplaceRolePermissionsHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute(command: ReplaceRolePermissionsCommand): Promise<PermissionChange> {
    const { actorRoleKey, roleId, permissions } = command.props;
    const change = await this.roles.modify(roleId, (role, active) => {
      if (role.key === actorRoleKey) throw new SelfRoleChangeException();
      return role.replacePermissions(permissions, active);
    });
    if (!change) throw new RoleNotFoundException();
    return change;
  }
}
