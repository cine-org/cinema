import { Logger, Module, type OnApplicationBootstrap } from '@nestjs/common';
import {
  PermissionCatalogRepository,
  SyncPermissionCatalogCommand,
  SyncPermissionCatalogHandler,
} from './app';
import { PrismaPermissionCatalogRepository } from './infra';

const handlers = [SyncPermissionCatalogHandler];

// Needs DatabaseModule registered by the app. Syncs the permission catalog on startup, before the
// app serves requests that check permissions.
@Module({
  providers: [
    { provide: PermissionCatalogRepository, useClass: PrismaPermissionCatalogRepository },
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
