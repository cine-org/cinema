import { Inject, Injectable } from '@nestjs/common';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';

export type RevokePermissionFromRoleCommandProps = {
  readonly roleId: string;
  readonly permissionId: string;
};

export class RevokePermissionFromRoleCommand {
  constructor(readonly props: RevokePermissionFromRoleCommandProps) {}
}

@Injectable()
export class RevokePermissionFromRoleHandler {
  constructor(@Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository) {}

  async execute(command: RevokePermissionFromRoleCommand): Promise<void> {
    await this.userAccess.revokePermissionFromRole(
      command.props.roleId,
      command.props.permissionId,
    );
  }
}
