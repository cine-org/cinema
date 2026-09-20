import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../../domain';
import { RoleNotFoundException } from '../../domain';
import {
  ROLE_REPOSITORY,
  USER_ACCESS_REPOSITORY,
  type RoleRepository,
  type UserAccessRepository,
} from '../ports';

export class GetRolePermissionsQuery {
  constructor(readonly roleId: string) {}
}

@Injectable()
export class GetRolePermissionsHandler {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
  ) {}

  async execute(query: GetRolePermissionsQuery): Promise<Permission[]> {
    if (!(await this.roles.findById(query.roleId))) throw new RoleNotFoundException();
    return this.userAccess.getRolePermissions(query.roleId);
  }
}
