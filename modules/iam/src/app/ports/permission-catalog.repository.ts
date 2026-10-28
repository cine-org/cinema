import type { CatalogSyncPlan, StoredCatalog } from '../../domain';

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class PermissionCatalogRepository {
  // Reads the stored catalog and applies the plan `decide` makes from it, in one transaction that
  // excludes concurrent syncs (several API instances start together).
  abstract sync(decide: (stored: StoredCatalog) => CatalogSyncPlan): Promise<CatalogSyncPlan>;
}
