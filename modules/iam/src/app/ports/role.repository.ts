import type { Role } from '../../domain';

export abstract class RoleRepository {
  // Permission keys that are not deprecated: the ones a role may be given.
  abstract findCatalog(): Promise<Set<string>>;

  // Throws RoleKeyTakenException when another role has the key.
  abstract create(role: Role): Promise<void>;

  // Loads the role, locked against concurrent edits, with the catalog, applies `change` and saves
  // what it changed, in one transaction. Null when the role does not exist.
  abstract modify<T>(
    roleId: string,
    change: (role: Role, catalog: ReadonlySet<string>) => T,
  ): Promise<T | null>;
}
