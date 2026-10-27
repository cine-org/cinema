import type { Page, PageRequest } from '@repo/common';
import type { GrantPlace, RoleScope, TheaterScope } from '../../domain';
import type { EmployeeView } from '../views';

export type RoleSummary = {
  readonly key: string;
  readonly scopes: readonly RoleScope[];
};

export type RoleChange = {
  readonly userId: string;
  readonly roleKey: string;
  readonly place: GrantPlace;
  readonly actorId: string;
};

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class RoleAssignmentRepository {
  abstract findRoleByKey(key: string): Promise<RoleSummary | null>;
  abstract clusterExists(clusterId: string): Promise<boolean>;
  // Whether a theater exists and is not closed.
  abstract isOpenTheater(theaterId: string): Promise<boolean>;
  // Revokes the account's active role and grants the new one, under a lock on the account. Fails
  // with AccountNotFoundException, CustomerAccountException or LastAdminException.
  abstract changeRole(change: RoleChange): Promise<void>;
  // Internal accounts the scope covers: cluster grants of its clusters and theater grants of its
  // theaters, or of theaters in its clusters.
  abstract listEmployees(scope: TheaterScope, page: PageRequest): Promise<Page<EmployeeView>>;
}
