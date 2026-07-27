import { Inject, Injectable } from '@nestjs/common';
import { RoleNotFoundException } from '../../domain';
import {
  ROLE_REPOSITORY,
  USER_ACCESS_REPOSITORY,
  type RoleRepository,
  type UserAccessRepository,
} from '../ports';

export type AssignRoleToUserCommandProps = {
  readonly userId: string;
  readonly roleId: string;
};

export class AssignRoleToUserCommand {
  constructor(readonly props: AssignRoleToUserCommandProps) {}
}

@Injectable()
export class AssignRoleToUserHandler {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
  ) {}

  async execute(command: AssignRoleToUserCommand): Promise<void> {
    const role = await this.roles.findById(command.props.roleId);

    if (!role) {
      throw new RoleNotFoundException();
    }

    await this.userAccess.assignRoleToUser(command.props.userId, role.id);
  }
}
