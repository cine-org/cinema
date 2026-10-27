import { Logger, Module, type OnApplicationBootstrap } from '@nestjs/common';
import {
  ChangeUserRoleHandler,
  CreateRoleHandler,
  GetRoleHandler,
  ListEmployeesHandler,
  ListPermissionsHandler,
  ListRolesHandler,
  PermissionCatalogRepository,
  ReplaceRolePermissionsHandler,
  RoleAssignmentRepository,
  RoleRepository,
  SyncPermissionCatalogCommand,
  SyncPermissionCatalogHandler,
} from './app';
import {
  PrismaPermissionCatalogRepository,
  PrismaRoleAssignmentRepository,
  PrismaRoleRepository,
} from './infra';

const handlers = [
  SyncPermissionCatalogHandler,
  ListPermissionsHandler,
  ListRolesHandler,
  GetRoleHandler,
  CreateRoleHandler,
  ReplaceRolePermissionsHandler,
  ChangeUserRoleHandler,
  ListEmployeesHandler,
];

// Needs DatabaseModule registered by the app. Syncs the permission catalog on startup, before the
// app serves requests that check permissions.
@Module({
  providers: [
    { provide: PermissionCatalogRepository, useClass: PrismaPermissionCatalogRepository },
    { provide: RoleRepository, useClass: PrismaRoleRepository },
    { provide: RoleAssignmentRepository, useClass: PrismaRoleAssignmentRepository },
    ...handlers,
  ],
  exports: [...handlers],
})
export class IamModule implements OnApplicationBootstrap {
  private readonly logger = new Logger(IamModule.name);

  constructor(private readonly sync: SyncPermissionCatalogHandler) {}

  async onApplicationBootstrap(): Promise<void> {
    const plan = await this.sync.execute(new SyncPermissionCatalogCommand());
    const changes = [
      plan.add.length && `${plan.add.length} added`,
      plan.restore.length && `${plan.restore.length} restored`,
      plan.deprecate.length && `${plan.deprecate.length} deprecated`,
      plan.describe.length && `${plan.describe.length} described`,
    ].filter(Boolean);
    if (changes.length > 0) this.logger.log(`Permission catalog synced: ${changes.join(', ')}`);
  }
}
