import { Body, Get, HttpStatus, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedAccount } from '@repo/auth';
import { IdResponseDto } from '@/common/dto';
import { ApiSuccess } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import { CurrentAuth } from '@/modules/auth';
import {
  AdminCreateRoleRequestDto,
  AdminPermissionChangeResponseDto,
  AdminReplaceRolePermissionsRequestDto,
  AdminRoleResponseDto,
} from './dto';
import { IamService } from './iam.service';

// Changes reach the holders of a role on their next request: permissions are read per request.
@ApiTags('admin-roles')
@AdminApi('roles')
export class AdminRolesController {
  constructor(private readonly iam: IamService) {}

  @Get()
  @RequirePermission('roles:read')
  @ApiSuccess([AdminRoleResponseDto], {
    description: 'Every role: system roles first, then custom roles by name.',
  })
  async list(): Promise<AdminRoleResponseDto[]> {
    return (await this.iam.listRoles()).map((role) => AdminRoleResponseDto.from(role));
  }

  @Get(':id')
  @RequirePermission('roles:read')
  @ApiSuccess(AdminRoleResponseDto, { description: 'A single role.' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<AdminRoleResponseDto> {
    return AdminRoleResponseDto.from(await this.iam.findRole(id));
  }

  @Post()
  @RequirePermission('roles:create')
  @ApiSuccess(IdResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Custom role created; a copy of a role passes its permissions.',
  })
  async create(@Body() body: AdminCreateRoleRequestDto): Promise<IdResponseDto> {
    return this.iam.createRole({
      key: body.key,
      name: body.name,
      scopes: body.scopes,
      permissions: body.permissions,
    });
  }

  @Put(':id/permissions')
  @RequirePermission('roles:update')
  @ApiSuccess(AdminPermissionChangeResponseDto, {
    description: 'Permissions replaced; SUPER_ADMIN and the caller’s own role refuse.',
  })
  async replacePermissions(
    @CurrentAuth() auth: AuthenticatedAccount,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminReplaceRolePermissionsRequestDto,
  ): Promise<AdminPermissionChangeResponseDto> {
    const change = await this.iam.replacePermissions({
      actorRoleKey: auth.role.key,
      roleId: id,
      permissions: body.permissions,
    });
    return AdminPermissionChangeResponseDto.from(change);
  }
}
