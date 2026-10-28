import {
  CustomerAccountException,
  LastAdminException,
  NotInternalRoleException,
  RoleScopeMismatchException,
} from '../exceptions';
import { ROLE_SCOPE, SYSTEM_ROLE, type RoleScope } from '../roles';

// Where a role is granted: clusterId for CLUSTER, theaterId for THEATER, neither for GLOBAL.
export type GrantPlace = {
  readonly scope: RoleScope;
  readonly clusterId: string | null;
  readonly theaterId: string | null;
};

// The account's role before the change; otherAdmins counts the other active SUPER_ADMINs, only
// when the account is one.
export type CurrentRole = { readonly roleKey: string; readonly otherAdmins: number | null };

export function assertGrantable(
  role: { readonly scopes: readonly RoleScope[] },
  place: GrantPlace,
) {
  if (role.scopes.includes(ROLE_SCOPE.SELF)) throw new NotInternalRoleException();
  if (!role.scopes.includes(place.scope)) throw new RoleScopeMismatchException();

  const fits =
    (place.scope === ROLE_SCOPE.GLOBAL && !place.clusterId && !place.theaterId) ||
    (place.scope === ROLE_SCOPE.CLUSTER && !!place.clusterId && !place.theaterId) ||
    (place.scope === ROLE_SCOPE.THEATER && !place.clusterId && !!place.theaterId);
  if (!fits) throw new RoleScopeMismatchException();
}

export function assertReplaceable(current: CurrentRole, nextRoleKey: string) {
  if (current.roleKey === SYSTEM_ROLE.CUSTOMER) throw new CustomerAccountException();

  const leavesAdmins =
    current.roleKey === SYSTEM_ROLE.SUPER_ADMIN && nextRoleKey !== SYSTEM_ROLE.SUPER_ADMIN;
  if (leavesAdmins && current.otherAdmins === 0) throw new LastAdminException();
}
