import { ROLE_SCOPE, type RoleScope } from '../roles';

// What an account may do now: its active role, where it was granted (the cluster of a CLUSTER
// grant, the theater of a THEATER grant), and the role's permissions as stored (an admin's edits
// included).
export type Grant = {
  readonly roleKey: string;
  readonly scope: RoleScope;
  readonly clusterId: string | null;
  readonly theaterId: string | null;
  readonly permissions: readonly string[];
};

// What a route acts on:
// - GLOBAL: nothing tied to a theater (creating a theater, the role list): GLOBAL grants only;
// - ANY_SCOPE: data shared by every theater (the seat type catalog): any grant with the permission;
// - THEATER: one theater, found from the route, with the cluster it belongs to;
// - LIST: several theaters, narrowed to the ones the caller may see.
export type AccessTarget =
  | { readonly kind: 'GLOBAL' }
  | { readonly kind: 'ANY_SCOPE' }
  | {
      readonly kind: 'THEATER';
      readonly theaterId: string | null;
      readonly clusterId: string | null;
    }
  | { readonly kind: 'LIST' };

// Which theaters a list may show: every one, or those of some clusters plus some theaters.
export type TheaterScope =
  | { readonly all: true }
  | {
      readonly all: false;
      readonly clusterIds: readonly string[];
      readonly theaterIds: readonly string[];
    };

export type AccessDecision =
  | { readonly allowed: true; readonly theaters: TheaterScope }
  | { readonly allowed: false };

const DENIED: AccessDecision = { allowed: false };

export function decideAccess(
  grant: Grant,
  permission: string,
  target: AccessTarget,
): AccessDecision {
  if (!grant.permissions.includes(permission) || grant.scope === ROLE_SCOPE.SELF) return DENIED;

  const own = theatersOf(grant);
  const allowed: AccessDecision = { allowed: true, theaters: own };

  switch (target.kind) {
    case 'ANY_SCOPE':
    case 'LIST':
      return allowed;
    case 'GLOBAL':
      return grant.scope === ROLE_SCOPE.GLOBAL ? allowed : DENIED;
    case 'THEATER':
      // An unknown target, or a grant that lost its cluster or theater: nothing to act on.
      switch (grant.scope) {
        case ROLE_SCOPE.GLOBAL:
          return allowed;
        case ROLE_SCOPE.CLUSTER:
          return target.clusterId !== null && target.clusterId === grant.clusterId
            ? allowed
            : DENIED;
        default:
          return target.theaterId !== null && target.theaterId === grant.theaterId
            ? allowed
            : DENIED;
      }
  }
}

function theatersOf(grant: Grant): TheaterScope {
  switch (grant.scope) {
    case ROLE_SCOPE.GLOBAL:
      return { all: true };
    case ROLE_SCOPE.CLUSTER:
      return { all: false, clusterIds: grant.clusterId ? [grant.clusterId] : [], theaterIds: [] };
    default:
      return { all: false, clusterIds: [], theaterIds: grant.theaterId ? [grant.theaterId] : [] };
  }
}
