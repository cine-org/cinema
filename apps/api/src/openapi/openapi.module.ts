import { Module, type InjectionToken, type Provider } from '@nestjs/common';
import { AuthService } from '@repo/auth';
import { DatabaseClient } from '@repo/database';
import {
  AssignRoleToUserHandler,
  CreateRoleHandler,
  DeleteRoleHandler,
  GetRolePermissionsHandler,
  GetUserPermissionsHandler,
  GetUserRolesHandler,
  GrantPermissionToRoleHandler,
  ListPermissionsHandler,
  ListRolesHandler,
  RevokePermissionFromRoleHandler,
  RevokeRoleFromUserHandler,
  UpdatePermissionHandler,
  UpdateRoleHandler,
} from '@repo/iam';
import {
  ActivateUserHandler,
  DeactivateUserHandler,
  GetUserByIdHandler,
  GetUsersPageHandler,
  SuspendUserHandler,
  UpdateUserProfileHandler,
} from '@repo/users';
import { AuthController, SelfUserController } from '@/auth.controller';
import { IamController } from '@/iam.controller';
import { ConfigService } from '@/config';
import { HealthController } from '@/health.controller';

const mocked = (provide: InjectionToken): Provider => ({ provide, useValue: {} });

@Module({
  controllers: [HealthController, AuthController, SelfUserController, IamController],
  providers: [
    mocked(DatabaseClient),
    mocked(AuthService),
    mocked(ConfigService),
    mocked(ActivateUserHandler),
    mocked(DeactivateUserHandler),
    mocked(SuspendUserHandler),
    mocked(GetUserByIdHandler),
    mocked(GetUsersPageHandler),
    mocked(UpdateUserProfileHandler),
    mocked(ListRolesHandler),
    mocked(CreateRoleHandler),
    mocked(UpdateRoleHandler),
    mocked(DeleteRoleHandler),
    mocked(ListPermissionsHandler),
    mocked(UpdatePermissionHandler),
    mocked(GetUserRolesHandler),
    mocked(GetUserPermissionsHandler),
    mocked(GetRolePermissionsHandler),
    mocked(AssignRoleToUserHandler),
    mocked(RevokeRoleFromUserHandler),
    mocked(GrantPermissionToRoleHandler),
    mocked(RevokePermissionFromRoleHandler),
  ],
})
export class OpenApiModule {}
