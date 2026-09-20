import { Inject, Injectable } from '@nestjs/common';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';
import { ROLE_REPOSITORY, type RoleRepository } from '../ports';
import { RoleNotFoundException } from '../../domain';
import { DatabaseClient } from '@repo/database';
import { UserNotFoundException } from '@repo/users';

export type RevokeRoleFromUserCommandProps = {
  readonly userId: string;
  readonly roleId: string;
};

export class RevokeRoleFromUserCommand {
  constructor(readonly props: RevokeRoleFromUserCommandProps) {}
}

@Injectable()
export class RevokeRoleFromUserHandler {
  constructor(
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(command: RevokeRoleFromUserCommand): Promise<void> {
    const [role, user] = await Promise.all([
      this.roles.findById(command.props.roleId),
      this.db.user.findUnique({ where: { id: command.props.userId }, select: { id: true } }),
    ]);
    if (!role) throw new RoleNotFoundException();
    if (!user) throw new UserNotFoundException();
    await this.userAccess.revokeRoleFromUser(command.props.userId, role.id);
  }
}
