import { Injectable } from '@nestjs/common';
import { planCatalogSync, type CatalogSyncPlan } from '../../domain';
import { PermissionCatalogRepository } from '../ports';

export class SyncPermissionCatalogCommand {}

// Brings the database in line with the permission catalog in code. Idempotent.
@Injectable()
export class SyncPermissionCatalogHandler {
  constructor(private readonly catalog: PermissionCatalogRepository) {}

  async execute(_command: SyncPermissionCatalogCommand): Promise<CatalogSyncPlan> {
    return this.catalog.sync(planCatalogSync);
  }
}
