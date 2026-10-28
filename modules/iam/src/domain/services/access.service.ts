import type { PermissionKey } from '../permissions';
import { ROLE_SCOPE, type RoleScope } from '../roles';

// The role an account holds now, where it applies, and what that role may do.
export type AccessGrant = {
  readonly roleKey: string;
  readonly scope: RoleScope;
  // Set when scope is CLUSTER.
  readonly clusterId: string | null;
  // Set when scope is THEATER.
  readonly theaterId: string | null;
  readonly permissions: ReadonlySet<string>;
};

// The theater a request acts on, with its cluster; null when the resource belongs to no theater.
export type AccessTarget = { readonly theaterId: string; readonly clusterId: string | null } | null;

export type AccessDecision =
  | { readonly allowed: true }
  // Missing permission and out of scope answer the same, so a caller cannot tell whether a theater
  // outside their scope exists.
  | { readonly allowed: false; readonly permission: PermissionKey };

// The theaters a grant may see in lists.
export type TheaterScope =
  | { readonly all: true }
  | { readonly all: false; readonly clusterIds: string[]; readonly theaterIds: string[] };

export function decideAccess(
  grant: AccessGrant,
  permission: PermissionKey,
  target: AccessTarget,
): AccessDecision {
  const denied = { allowed: false, permission } as const;
  if (!grant.permissions.has(permission)) return denied;
  // A resource of no theater only needs the permission, whatever the scope.
  if (target === null) return grant.scope === ROLE_SCOPE.SELF ? denied : { allowed: true };

  switch (grant.scope) {
    case ROLE_SCOPE.GLOBAL:
      return { allowed: true };
    case ROLE_SCOPE.CLUSTER:
      // A theater in no cluster is in none of the grant's either.
      return target.clusterId !== null && target.clusterId === grant.clusterId
        ? { allowed: true }
        : denied;
    case ROLE_SCOPE.THEATER:
      return target.theaterId === grant.theaterId ? { allowed: true } : denied;
    case ROLE_SCOPE.SELF:
      return denied;
  }
}

export function visibleTheaters(grant: AccessGrant): TheaterScope {
  switch (grant.scope) {
    case ROLE_SCOPE.GLOBAL:
      return { all: true };
    case ROLE_SCOPE.CLUSTER:
      return { all: false, clusterIds: grant.clusterId ? [grant.clusterId] : [], theaterIds: [] };
    case ROLE_SCOPE.THEATER:
      return { all: false, clusterIds: [], theaterIds: grant.theaterId ? [grant.theaterId] : [] };
    case ROLE_SCOPE.SELF:
      return { all: false, clusterIds: [], theaterIds: [] };
  }
}
