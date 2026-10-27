import { Injectable } from '@nestjs/common';
import type { Page, PageRequest } from '@repo/common';
import {
  ChangeUserRoleCommand,
  ChangeUserRoleHandler,
  CreateRoleCommand,
  CreateRoleHandler,
  GetRoleHandler,
  GetRoleQuery,
  ListEmployeesHandler,
  ListEmployeesQuery,
  ListPermissionsHandler,
  ListPermissionsQuery,
  ListRolesHandler,
  ListRolesQuery,
  ReplaceRolePermissionsCommand,
  ReplaceRolePermissionsHandler,
  type ChangeUserRoleCommandProps,
  type CreateRoleCommandProps,
  type EmployeeView,
  type PermissionChange,
  type ReplaceRolePermissionsCommandProps,
  type RoleView,
  type TheaterScope,
} from '@repo/iam';

// One entry point for the module's handlers; controllers never touch a handler directly.
@Injectable()
export class IamService {
  constructor(
    private readonly listPermissionsHandler: ListPermissionsHandler,
    private readonly listRolesHandler: ListRolesHandler,
    private readonly getRoleHandler: GetRoleHandler,
    private readonly createRoleHandler: CreateRoleHandler,
    private readonly replacePermissionsHandler: ReplaceRolePermissionsHandler,
    private readonly changeUserRoleHandler: ChangeUserRoleHandler,
    private readonly listEmployeesHandler: ListEmployeesHandler,
  ) {}

  async listPermissions(): Promise<string[]> {
    return this.listPermissionsHandler.execute(new ListPermissionsQuery());
  }

  async listRoles(): Promise<RoleView[]> {
    return this.listRolesHandler.execute(new ListRolesQuery());
  }

  async findRole(roleId: string): Promise<RoleView> {
    return this.getRoleHandler.execute(new GetRoleQuery({ roleId }));
  }

  async createRole(props: CreateRoleCommandProps): Promise<{ id: string }> {
    return this.createRoleHandler.execute(new CreateRoleCommand(props));
  }

  async replacePermissions(props: ReplaceRolePermissionsCommandProps): Promise<PermissionChange> {
    return this.replacePermissionsHandler.execute(new ReplaceRolePermissionsCommand(props));
  }

  async changeUserRole(props: ChangeUserRoleCommandProps): Promise<void> {
    return this.changeUserRoleHandler.execute(new ChangeUserRoleCommand(props));
  }

  async listEmployees(scope: TheaterScope, page: PageRequest): Promise<Page<EmployeeView>> {
    return this.listEmployeesHandler.execute(new ListEmployeesQuery({ scope, page }));
  }
}
