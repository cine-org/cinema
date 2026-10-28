import {
  InvalidRoleException,
  RoleKeyTakenException,
  RoleLockedException,
  UnknownPermissionException,
} from '../exceptions';
import { ROLE_SCOPE, SYSTEM_ROLE_KEYS, type RoleScope } from '../roles';

export const ROLE_KEY_PATTERN = /^[A-Z][A-Z0-9_]{1,39}$/;
export const MAX_ROLE_NAME_LENGTH = 60;

export type RoleProps = {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  // Where the role may be granted.
  readonly scopes: readonly RoleScope[];
  readonly isSystem: boolean;
  readonly isLocked: boolean;
  permissions: Set<string>;
};

export type NewRole = {
  readonly key: string;
  readonly name: string;
  readonly scopes: readonly RoleScope[];
  readonly permissions: readonly string[];
};

export type PermissionChange = { readonly added: string[]; readonly removed: string[] };

// `catalog` is the set of permission keys that are not deprecated.
export class Role {
  private constructor(private readonly props: RoleProps) {}

  // A custom role: system roles come from the migration only.
  static create(input: NewRole, catalog: ReadonlySet<string>): Role {
    const key = input.key.trim().toUpperCase();
    if (!ROLE_KEY_PATTERN.test(key)) throw new InvalidRoleException();
    if ((SYSTEM_ROLE_KEYS as string[]).includes(key)) throw new RoleKeyTakenException();

    const name = input.name.trim();
    if (name === '' || name.length > MAX_ROLE_NAME_LENGTH) throw new InvalidRoleException();

    // Internal scopes only: SELF is the customer's.
    const scopes = [...new Set(input.scopes)];
    if (scopes.length === 0 || scopes.includes(ROLE_SCOPE.SELF)) {
      throw new InvalidRoleException();
    }

    return new Role({
      id: crypto.randomUUID(),
      key,
      name,
      scopes,
      isSystem: false,
      isLocked: false,
      permissions: Role.knownPermissions(input.permissions, catalog),
    });
  }

  static restore(props: RoleProps): Role {
    return new Role({ ...props, permissions: new Set(props.permissions) });
  }

  // Replaces the whole set, as the admin UI saves it.
  replacePermissions(
    permissions: readonly string[],
    catalog: ReadonlySet<string>,
  ): PermissionChange {
    if (this.props.isLocked) throw new RoleLockedException();

    const next = Role.knownPermissions(permissions, catalog);
    const before = this.props.permissions;
    this.props.permissions = next;
    return {
      added: [...next].filter((key) => !before.has(key)).sort(),
      removed: [...before].filter((key) => !next.has(key)).sort(),
    };
  }

  private static knownPermissions(
    permissions: readonly string[],
    catalog: ReadonlySet<string>,
  ): Set<string> {
    if (permissions.some((key) => !catalog.has(key))) throw new UnknownPermissionException();
    return new Set(permissions);
  }

  get id(): string {
    return this.props.id;
  }

  get key(): string {
    return this.props.key;
  }

  get name(): string {
    return this.props.name;
  }

  get scopes(): readonly RoleScope[] {
    return this.props.scopes;
  }

  get isSystem(): boolean {
    return this.props.isSystem;
  }

  get isLocked(): boolean {
    return this.props.isLocked;
  }

  get permissions(): string[] {
    return [...this.props.permissions].sort();
  }
}
