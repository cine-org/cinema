import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { randomUUID } from 'node:crypto';
import { PERMISSION_CODE } from '@repo/contracts';
import {
  AssignRoleToUserCommand,
  AssignRoleToUserHandler,
  CreateRoleCommand,
  CreateRoleHandler,
  DeleteRoleCommand,
  DeleteRoleHandler,
  GetUserPermissionsHandler,
  GetUserPermissionsQuery,
  GetRolePermissionsHandler,
  GetRolePermissionsQuery,
  GetUserRolesHandler,
  GetUserRolesQuery,
  GrantPermissionToRoleCommand,
  GrantPermissionToRoleHandler,
  ListPermissionsHandler,
  ListPermissionsQuery,
  ListRolesHandler,
  ListRolesQuery,
  RevokePermissionFromRoleCommand,
  RevokePermissionFromRoleHandler,
  RevokeRoleFromUserCommand,
  RevokeRoleFromUserHandler,
  UpdatePermissionCommand,
  UpdatePermissionHandler,
  UpdateRoleCommand,
  UpdateRoleHandler,
} from '@repo/iam';
import {
  ActivateUserCommand,
  ActivateUserHandler,
  DeactivateUserCommand,
  DeactivateUserHandler,
  GetUserByIdHandler,
  GetUserByIdQuery,
  GetUsersPageHandler,
  GetUsersPageQuery,
  SuspendUserCommand,
  SuspendUserHandler,
  USER_STATUS,
} from '@repo/users';
import { CurrentUser, RequirePermissions } from '@/common/auth';
import type { AuthPrincipal } from '@repo/contracts';

class RoleBody {
  @ApiPropertyOptional() code?: string;
  @ApiPropertyOptional({ nullable: true }) name?: string | null;
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
}
class PermissionBody {
  @ApiPropertyOptional({ nullable: true }) description?: string | null;
}

@ApiTags('iam')
@ApiBearerAuth('bearer')
@Controller()
export class IamController {
  constructor(
    private readonly getUsers: GetUsersPageHandler,
    private readonly getUser: GetUserByIdHandler,
    private readonly activateUser: ActivateUserHandler,
    private readonly deactivateUser: DeactivateUserHandler,
    private readonly suspendUser: SuspendUserHandler,
    private readonly listRoles: ListRolesHandler,
    private readonly createRole: CreateRoleHandler,
    private readonly updateRole: UpdateRoleHandler,
    private readonly deleteRole: DeleteRoleHandler,
    private readonly listPermissions: ListPermissionsHandler,
    private readonly updatePermission: UpdatePermissionHandler,
    private readonly getUserRoles: GetUserRolesHandler,
    private readonly getUserPermissions: GetUserPermissionsHandler,
    private readonly getRolePermissions: GetRolePermissionsHandler,
    private readonly assignRole: AssignRoleToUserHandler,
    private readonly revokeRole: RevokeRoleFromUserHandler,
    private readonly grantPermission: GrantPermissionToRoleHandler,
    private readonly revokePermission: RevokePermissionFromRoleHandler,
  ) {}

  @Get('users')
  @RequirePermissions(PERMISSION_CODE.User.ReadAny)
  async users(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const parsedStatus =
      status === undefined
        ? undefined
        : status === 'all' || Object.values(USER_STATUS).includes(status as never)
          ? (status as import('@repo/users').UserStatusFilter)
          : undefined;
    if (status !== undefined && parsedStatus === undefined)
      throw new BadRequestException('Invalid user status');
    const result = await this.getUsers.execute(
      new GetUsersPageQuery({
        page: Number(page) || 1,
        limit: Math.min(Number(limit) || 20, 100),
        status: parsedStatus,
        search,
      }),
    );
    return { ...result, items: result.items.map(this.userView) };
  }

  @Get('users/:id')
  @RequirePermissions(PERMISSION_CODE.User.ReadAny)
  async user(@Param('id') id: string) {
    return this.userView(await this.getUser.execute(new GetUserByIdQuery(id)));
  }

  @Post('users/:id/activate')
  @RequirePermissions(PERMISSION_CODE.User.ActivateAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  activate(@Param('id') id: string) {
    return this.activateUser.execute(new ActivateUserCommand(id));
  }

  @Post('users/:id/deactivate')
  @RequirePermissions(PERMISSION_CODE.User.DeactivateAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param('id') id: string) {
    return this.deactivateUser.execute(new DeactivateUserCommand(id));
  }

  @Post('users/:id/suspend')
  @RequirePermissions(PERMISSION_CODE.User.SuspendAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  suspend(@Param('id') id: string) {
    return this.suspendUser.execute(new SuspendUserCommand(id));
  }

  @Get('roles')
  @RequirePermissions(PERMISSION_CODE.Role.ReadAny)
  async roles(@Query('search') search?: string) {
    return (await this.listRoles.execute(new ListRolesQuery({ search }))).map(this.roleView);
  }

  @Post('roles')
  @RequirePermissions(PERMISSION_CODE.Role.CreateAny)
  async roleCreate(@Body() body: RoleBody) {
    await this.createRole.execute(
      new CreateRoleCommand({
        id: randomUUID(),
        code: body.code ?? '',
        name: body.name,
        description: body.description,
      }),
    );
    return { created: true };
  }

  @Patch('roles/:id')
  @RequirePermissions(PERMISSION_CODE.Role.UpdateAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  roleUpdate(@Param('id') id: string, @Body() body: RoleBody) {
    return this.updateRole.execute(
      new UpdateRoleCommand({ roleId: id, name: body.name, description: body.description }),
    );
  }

  @Delete('roles/:id')
  @RequirePermissions(PERMISSION_CODE.Role.DeleteAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  roleDelete(@Param('id') id: string) {
    return this.deleteRole.execute(new DeleteRoleCommand(id));
  }

  @Get('permissions')
  @RequirePermissions(PERMISSION_CODE.Permission.ReadAny)
  async permissions(@Query('search') search?: string) {
    return (await this.listPermissions.execute(new ListPermissionsQuery({ search }))).map(
      this.permissionView,
    );
  }

  @Patch('permissions/:id')
  @RequirePermissions(PERMISSION_CODE.Permission.UpdateAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  permissionUpdate(@Param('id') id: string, @Body() body: PermissionBody) {
    return this.updatePermission.execute(
      new UpdatePermissionCommand({ permissionId: id, description: body.description }),
    );
  }

  @Get('users/:id/roles')
  @RequirePermissions(PERMISSION_CODE.User.ReadRolesAny)
  async userRoles(@Param('id') id: string) {
    return (await this.getUserRoles.execute(new GetUserRolesQuery(id))).map(this.roleView);
  }

  @Get('users/:id/permissions')
  @RequirePermissions(PERMISSION_CODE.User.ReadPermissionsAny)
  async userPermissions(@Param('id') id: string) {
    return (await this.getUserPermissions.execute(new GetUserPermissionsQuery(id))).map(
      this.permissionView,
    );
  }

  @Get('roles/:id/permissions')
  @RequirePermissions(PERMISSION_CODE.Permission.ReadAny)
  async rolePermissions(@Param('id') id: string) {
    return (await this.getRolePermissions.execute(new GetRolePermissionsQuery(id))).map(
      this.permissionView,
    );
  }

  @Post('users/:id/roles/:roleId')
  @RequirePermissions(PERMISSION_CODE.User.AssignRoleAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  userRoleAssign(
    @CurrentUser() principal: AuthPrincipal,
    @Param('id') userId: string,
    @Param('roleId') roleId: string,
  ) {
    return this.assignRole.execute(
      new AssignRoleToUserCommand({ userId, roleId, assignedBy: principal.userId }),
    );
  }

  @Delete('users/:id/roles/:roleId')
  @RequirePermissions(PERMISSION_CODE.User.RevokeRoleAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  userRoleRevoke(@Param('id') userId: string, @Param('roleId') roleId: string) {
    return this.revokeRole.execute(new RevokeRoleFromUserCommand({ userId, roleId }));
  }

  @Post('roles/:id/permissions/:permissionId')
  @RequirePermissions(PERMISSION_CODE.Role.GrantPermissionAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  permissionGrant(@Param('id') roleId: string, @Param('permissionId') permissionId: string) {
    return this.grantPermission.execute(new GrantPermissionToRoleCommand({ roleId, permissionId }));
  }

  @Delete('roles/:id/permissions/:permissionId')
  @RequirePermissions(PERMISSION_CODE.Role.RevokePermissionAny)
  @HttpCode(HttpStatus.NO_CONTENT)
  permissionRevoke(@Param('id') roleId: string, @Param('permissionId') permissionId: string) {
    return this.revokePermission.execute(
      new RevokePermissionFromRoleCommand({ roleId, permissionId }),
    );
  }

  private userView(user: import('@repo/users').User) {
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      dateOfBirth: user.dateOfBirth,
      status: user.status.value,
      statusChangedAt: user.statusChangedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
  private roleView(role: import('@repo/iam').Role) {
    return {
      id: role.id,
      code: role.code.value,
      name: role.name,
      description: role.description,
      type: role.type.value,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }
  private permissionView(permission: import('@repo/iam').Permission) {
    return {
      id: permission.id,
      code: permission.code.value,
      description: permission.description,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
