import type { Role } from '../../domain';
import type { RoleView } from '../views';

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class RoleRepository {
  // The active catalog: what a role may be given.
  abstract listPermissions(): Promise<string[]>;
  abstract listRoles(): Promise<RoleView[]>;
  abstract findRole(id: string): Promise<RoleView | null>;
  // Fails with RoleKeyTakenException when the key exists.
  abstract create(role: Role): Promise<void>;
  // Loads the role locked against concurrent edits, runs `change` with the active catalog, then
  // saves its permission change. Null when the role does not exist.
  abstract modify<T>(
    roleId: string,
    change: (role: Role, active: ReadonlySet<string>) => T,
  ): Promise<T | null>;
}
