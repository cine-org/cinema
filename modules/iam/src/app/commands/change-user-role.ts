import { Injectable } from '@nestjs/common';
import {
  AccountNotFoundException,
  assertGrantable,
  assertReplaceable,
  ClusterNotFoundException,
  RoleNotFoundException,
  SelfRoleChangeException,
  TheaterUnavailableException,
  type RoleScope,
} from '../../domain';
import { RoleAssignmentRepository } from '../ports';

export class ChangeUserRoleCommand {
  constructor(
    readonly actorId: string,
    readonly accountId: string,
    readonly roleKey: string,
    readonly scope: RoleScope,
    readonly clusterId: string | null,
    readonly theaterId: string | null,
  ) {}
}

// Swaps the account's role and scope in one step; the old grant stays as history. The account
// gets its new access on its next request.
@Injectable()
export class ChangeUserRoleHandler {
  constructor(private readonly assignments: RoleAssignmentRepository) {}

  async execute(command: ChangeUserRoleCommand): Promise<void> {
    if (command.actorId === command.accountId) throw new SelfRoleChangeException();

    const role = await this.assignments.findRoleByKey(command.roleKey);
    if (!role) throw new RoleNotFoundException();

    const place = {
      scope: command.scope,
      clusterId: command.clusterId,
      theaterId: command.theaterId,
    };
    assertGrantable(role, place);
    if (place.clusterId && !(await this.assignments.clusterExists(place.clusterId))) {
      throw new ClusterNotFoundException();
    }
    if (place.theaterId && !(await this.assignments.isOpenTheater(place.theaterId))) {
      throw new TheaterUnavailableException();
    }

    const changed = await this.assignments.changeRole(
      { ...place, accountId: command.accountId, role, actorId: command.actorId },
      (current) => assertReplaceable(current, role.key),
    );
    if (!changed) throw new AccountNotFoundException();
  }
}
