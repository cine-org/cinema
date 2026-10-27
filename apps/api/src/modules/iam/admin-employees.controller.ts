import { Body, Get, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedAccount } from '@repo/auth';
import type { Page } from '@repo/common';
import type { TheaterScope } from '@repo/iam';
import { IdResponseDto } from '@/common/dto';
import { ApiPaginated, ApiSuccess } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import { CurrentAuth, TheaterScopeParam } from '@/modules/auth';
import {
  AdminChangeUserRoleRequestDto,
  AdminEmployeeResponseDto,
  AdminListEmployeesQueryDto,
} from './dto';
import { IamService } from './iam.service';

// Internal accounts and their roles, under /admin/users like the admin app's screens.
@ApiTags('admin-users')
@AdminApi('users')
export class AdminEmployeesController {
  constructor(private readonly iam: IamService) {}

  @Get()
  @RequirePermission('users:read.any', 'list')
  @ApiPaginated(AdminEmployeeResponseDto, {
    description:
      'Internal accounts with their role, pending invitations included; newest first. A cluster or theater role sees its own theaters only.',
  })
  async list(
    @Query() query: AdminListEmployeesQueryDto,
    @TheaterScopeParam() scope: TheaterScope,
  ): Promise<Page<AdminEmployeeResponseDto>> {
    const page = await this.iam.listEmployees(scope, { page: query.page, limit: query.limit });
    return {
      ...page,
      items: page.items.map((employee) => AdminEmployeeResponseDto.from(employee)),
    };
  }

  @Patch(':id')
  @RequirePermission('roles:assign')
  @ApiSuccess(IdResponseDto, {
    description: 'Role and scope replaced in one step; the account gets them on its next request.',
  })
  async changeRole(
    @CurrentAuth() auth: AuthenticatedAccount,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminChangeUserRoleRequestDto,
  ): Promise<IdResponseDto> {
    await this.iam.changeUserRole({
      actorId: auth.accountId,
      userId: id,
      roleKey: body.role,
      place: {
        scope: body.scope,
        clusterId: body.clusterId ?? null,
        theaterId: body.theaterId ?? null,
      },
    });
    return { id };
  }
}
