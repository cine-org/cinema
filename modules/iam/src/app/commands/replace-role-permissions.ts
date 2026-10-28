import { Injectable } from '@nestjs/common';
import {
  RoleNotFoundException,
  SelfRoleChangeException,
  SYSTEM_ROLE,
  type PermissionChange,
} from '../../domain';
import { AccessGrantRepository, RoleRepository } from '../ports';

export class ReplaceRolePermissionsCommand {
  constructor(
    readonly actorId: string,
    readonly roleId: string,
    readonly permissions: readonly string[],
  ) {}
}

// Holders get the new set on their next request.
@Injectable()
export class ReplaceRolePermissionsHandler {
  constructor(
    private readonly roles: RoleRepository,
    private readonly grants: AccessGrantRepository,
  ) {}

  async execute(command: ReplaceRolePermissionsCommand): Promise<PermissionChange> {
    const actor = await this.grants.findActive(command.actorId);

    const change = await this.roles.modify(command.roleId, (role, catalog) => {
      // Hidden from the role queries too: the admin manages internal roles only.
      if (role.key === SYSTEM_ROLE.CUSTOMER) throw new RoleNotFoundException();
      if (role.key === actor?.roleKey) throw new SelfRoleChangeException();
      return role.replacePermissions(command.permissions, catalog);
    });
    if (!change) throw new RoleNotFoundException();
    return change;
  }
}
