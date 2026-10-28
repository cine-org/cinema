import type { CurrentRole, GrantPlace, RoleScope } from '../../domain';

export type GrantableRole = {
  readonly id: string;
  readonly key: string;
  readonly scopes: readonly RoleScope[];
};

export type RoleChange = GrantPlace & {
  readonly accountId: string;
  readonly role: GrantableRole;
  readonly actorId: string;
};

export abstract class RoleAssignmentRepository {
  abstract findRoleByKey(key: string): Promise<GrantableRole | null>;

  abstract clusterExists(clusterId: string): Promise<boolean>;

  // Exists and is not closed.
  abstract isOpenTheater(theaterId: string): Promise<boolean>;

  // In one transaction with the account locked: reads its active role, lets `check` refuse the
  // change, then revokes that role and grants the new one. False when the account does not exist
  // or holds no role.
  abstract changeRole(change: RoleChange, check: (current: CurrentRole) => void): Promise<boolean>;
}
