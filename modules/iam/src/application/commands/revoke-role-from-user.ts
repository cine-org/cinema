import { Inject, Injectable } from '@nestjs/common';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';

export type RevokeRoleFromUserCommandProps = {
  readonly userId: string;
  readonly roleId: string;
};

export class RevokeRoleFromUserCommand {
  constructor(readonly props: RevokeRoleFromUserCommandProps) {}
}

@Injectable()
export class RevokeRoleFromUserHandler {
  constructor(@Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository) {}

  async execute(command: RevokeRoleFromUserCommand): Promise<void> {
    await this.userAccess.revokeRoleFromUser(command.props.userId, command.props.roleId);
  }
}
