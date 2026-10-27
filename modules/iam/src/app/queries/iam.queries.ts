import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '@repo/common';
import { RoleNotFoundException, type TheaterScope } from '../../domain';
import { RoleAssignmentRepository, RoleRepository } from '../ports';
import type { EmployeeView, RoleView } from '../views';

export class ListPermissionsQuery {}

// The active catalog, by key.
@Injectable()
export class ListPermissionsHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute(_query: ListPermissionsQuery): Promise<string[]> {
    return this.roles.listPermissions();
  }
}

export class ListRolesQuery {}

@Injectable()
export class ListRolesHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute(_query: ListRolesQuery): Promise<RoleView[]> {
    return this.roles.listRoles();
  }
}

export class GetRoleQuery {
  constructor(readonly props: { readonly roleId: string }) {}
}

@Injectable()
export class GetRoleHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute(query: GetRoleQuery): Promise<RoleView> {
    const role = await this.roles.findRole(query.props.roleId);
    if (!role) throw new RoleNotFoundException();
    return role;
  }
}

export class ListEmployeesQuery {
  constructor(readonly props: { readonly scope: TheaterScope; readonly page: PageRequest }) {}
}

// Internal accounts with their role, pending invitations included; a cluster or theater role sees
// the accounts of its own theaters only. Newest first.
@Injectable()
export class ListEmployeesHandler {
  constructor(private readonly assignments: RoleAssignmentRepository) {}

  async execute(query: ListEmployeesQuery): Promise<Page<EmployeeView>> {
    return this.assignments.listEmployees(query.props.scope, query.props.page);
  }
}
