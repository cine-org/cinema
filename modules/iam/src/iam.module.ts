import { Module } from '@nestjs/common';
import {
  AssignRoleToUserHandler,
  CheckUserPermissionHandler,
  CreateRoleHandler,
  DeleteRoleHandler,
  GetPermissionByCodeHandler,
  GetPermissionByIdHandler,
  GetRoleByCodeHandler,
  GetRoleByIdHandler,
  GetUserPermissionsHandler,
  GetUserRolesHandler,
  GrantPermissionToRoleHandler,
  ListPermissionsHandler,
  ListRolesHandler,
  PERMISSION_REPOSITORY,
  ROLE_REPOSITORY,
  RevokePermissionFromRoleHandler,
  RevokeRoleFromUserHandler,
  UpdatePermissionHandler,
  UpdateRoleHandler,
  USER_ACCESS_REPOSITORY,
} from './application';
import {
  PrismaPermissionRepository,
  PrismaRoleRepository,
  PrismaUserAccessRepository,
} from './infrastructure';

const commandHandlers = [
  AssignRoleToUserHandler,
  CreateRoleHandler,
  DeleteRoleHandler,
  GrantPermissionToRoleHandler,
  RevokePermissionFromRoleHandler,
  RevokeRoleFromUserHandler,
  UpdatePermissionHandler,
  UpdateRoleHandler,
];

const queryHandlers = [
  CheckUserPermissionHandler,
  GetPermissionByCodeHandler,
  GetPermissionByIdHandler,
  GetRoleByCodeHandler,
  GetRoleByIdHandler,
  GetUserPermissionsHandler,
  GetUserRolesHandler,
  ListPermissionsHandler,
  ListRolesHandler,
];

@Module({
  providers: [
    PrismaPermissionRepository,
    PrismaRoleRepository,
    PrismaUserAccessRepository,
    {
      provide: PERMISSION_REPOSITORY,
      useExisting: PrismaPermissionRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useExisting: PrismaRoleRepository,
    },
    {
      provide: USER_ACCESS_REPOSITORY,
      useExisting: PrismaUserAccessRepository,
    },
    ...commandHandlers,
    ...queryHandlers,
  ],
  exports: [...commandHandlers, ...queryHandlers],
})
export class IamModule {}
