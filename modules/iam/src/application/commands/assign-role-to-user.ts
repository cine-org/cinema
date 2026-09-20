import { Inject, Injectable } from '@nestjs/common';
import { RoleNotFoundException } from '../../domain';
import { DatabaseClient } from '@repo/database';
import { UserNotFoundException } from '@repo/users';
import {
  ROLE_REPOSITORY,
  USER_ACCESS_REPOSITORY,
  type RoleRepository,
  type UserAccessRepository,
} from '../ports';

export type AssignRoleToUserCommandProps = {
  readonly userId: string;
  readonly roleId: string;
  readonly assignedBy?: string;
};

export class AssignRoleToUserCommand {
  constructor(readonly props: AssignRoleToUserCommandProps) {}
}

@Injectable()
export class AssignRoleToUserHandler {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(command: AssignRoleToUserCommand): Promise<void> {
    const role = await this.roles.findById(command.props.roleId);

    if (!role) {
      throw new RoleNotFoundException();
    }

    if (
      !(await this.db.user.findUnique({
        where: { id: command.props.userId },
        select: { id: true },
      }))
    ) {
      throw new UserNotFoundException();
    }

    await this.userAccess.assignRoleToUser(command.props.userId, role.id, command.props.assignedBy);
  }
}
