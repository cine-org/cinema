import { Injectable } from '@nestjs/common';
import {
  assertGrantable,
  ClusterNotFoundException,
  RoleNotFoundException,
  SelfRoleChangeException,
  TheaterUnavailableException,
  type GrantPlace,
} from '../../domain';
import { RoleAssignmentRepository } from '../ports';

export type ChangeUserRoleCommandProps = {
  readonly actorId: string;
  readonly userId: string;
  readonly roleKey: string;
  readonly place: GrantPlace;
};

export class ChangeUserRoleCommand {
  constructor(readonly props: ChangeUserRoleCommandProps) {}
}

// Gives an internal account another role, or the same one somewhere else, in one step: the old
// grant is revoked and kept for history. The account gets it on its next request.
@Injectable()
export class ChangeUserRoleHandler {
  constructor(private readonly assignments: RoleAssignmentRepository) {}

  async execute(command: ChangeUserRoleCommand): Promise<void> {
    const { actorId, userId, roleKey, place } = command.props;
    if (actorId === userId) throw new SelfRoleChangeException();

    const role = await this.assignments.findRoleByKey(roleKey);
    if (!role) throw new RoleNotFoundException();
    assertGrantable(role, place);
    if (place.clusterId && !(await this.assignments.clusterExists(place.clusterId))) {
      throw new ClusterNotFoundException();
    }
    if (place.theaterId && !(await this.assignments.isOpenTheater(place.theaterId))) {
      throw new TheaterUnavailableException();
    }

    await this.assignments.changeRole({ userId, roleKey, place, actorId });
  }
}
