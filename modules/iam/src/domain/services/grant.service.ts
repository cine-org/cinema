import { NotInternalRoleException, RoleScopeMismatchException } from '../exceptions';
import { ROLE_SCOPE, type RoleScope } from '../roles';

// Where a role is granted: the cluster of a CLUSTER grant, the theater of a THEATER grant.
export type GrantPlace = {
  readonly scope: RoleScope;
  readonly clusterId: string | null;
  readonly theaterId: string | null;
};

// An internal role, at one of the scopes it allows, pointing at what that scope names. Whether the
// cluster or theater exists is the caller's to check.
export function assertGrantable(
  role: { readonly scopes: readonly RoleScope[] },
  place: GrantPlace,
) {
  if (role.scopes.includes(ROLE_SCOPE.SELF)) throw new NotInternalRoleException();
  if (!role.scopes.includes(place.scope)) throw new RoleScopeMismatchException();

  const matches =
    place.scope === ROLE_SCOPE.CLUSTER
      ? place.clusterId !== null && place.theaterId === null
      : place.scope === ROLE_SCOPE.THEATER
        ? place.theaterId !== null && place.clusterId === null
        : place.clusterId === null && place.theaterId === null;
  if (!matches) throw new RoleScopeMismatchException();
}
