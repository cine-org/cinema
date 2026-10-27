import {
  InvalidRoleException,
  RoleLockedException,
  UnknownPermissionException,
} from '../exceptions';
import { ROLE_SCOPE, SYSTEM_ROLE_KEYS, type RoleScope } from '../roles';

export type RoleProps = {
  readonly id: string;
  readonly key: string;
  readonly name: string;
  readonly scopes: readonly RoleScope[];
  readonly isSystem: boolean;
  readonly isLocked: boolean;
  permissions: ReadonlySet<string>;
};

export type PermissionChange = {
  readonly added: string[];
  readonly removed: string[];
};

// Upper snake case, like the system roles; never one of theirs.
const CUSTOM_KEY = /^[A-Z][A-Z0-9_]{1,39}$/;
const MAX_NAME = 60;
// Customers only come by registration, so a custom role is for internal accounts.
const INTERNAL_SCOPES: readonly RoleScope[] = [
  ROLE_SCOPE.GLOBAL,
  ROLE_SCOPE.CLUSTER,
  ROLE_SCOPE.THEATER,
];

export class Role {
  // What replacePermissions changed; the repository saves it.
  private change: PermissionChange | null = null;

  private constructor(private readonly props: RoleProps) {}

  static restore(props: RoleProps): Role {
    return new Role({ ...props, permissions: new Set(props.permissions) });
  }

  // A role an admin makes, for people who need another set of permissions than a system role,
  // or a copy of a role to start from.
  static create(input: {
    id: string;
    key: string;
    name: string;
    scopes: readonly RoleScope[];
    permissions: readonly string[];
    active: ReadonlySet<string>;
  }): Role {
    if (
      !CUSTOM_KEY.test(input.key) ||
      (SYSTEM_ROLE_KEYS as readonly string[]).includes(input.key)
    ) {
      throw new InvalidRoleException('The key must be UPPER_SNAKE_CASE and not a system role');
    }
    const scopes = [...new Set(input.scopes)];
    if (scopes.length === 0 || !scopes.every((scope) => INTERNAL_SCOPES.includes(scope))) {
      throw new InvalidRoleException('A custom role is granted GLOBAL, CLUSTER or THEATER');
    }
    const name = input.name.trim();
    if (name.length === 0 || name.length > MAX_NAME) {
      throw new InvalidRoleException(`The name must be 1 to ${MAX_NAME} characters`);
    }

    const role = new Role({
      id: input.id,
      key: input.key,
      name,
      scopes,
      isSystem: false,
      isLocked: false,
      permissions: new Set(),
    });
    role.replacePermissions(input.permissions, input.active);
    return role;
  }

  // `active` is the catalog minus deprecated keys: only those can be granted.
  replacePermissions(keys: readonly string[], active: ReadonlySet<string>): PermissionChange {
    if (this.props.isLocked) throw new RoleLockedException();

    const next = new Set(keys);
    const unknown = [...next].filter((key) => !active.has(key));
    if (unknown.length > 0) throw new UnknownPermissionException(unknown);

    const current = this.props.permissions;
    const change = {
      added: [...next].filter((key) => !current.has(key)).sort(),
      removed: [...current].filter((key) => !next.has(key)).sort(),
    };
    this.props.permissions = next;
    this.change = change;
    return change;
  }

  get permissionChange(): PermissionChange | null {
    return this.change;
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

  get permissions(): string[] {
    return [...this.props.permissions].sort();
  }
}
