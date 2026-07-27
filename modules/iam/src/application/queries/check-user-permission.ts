import { Inject, Injectable } from '@nestjs/common';
import { PermissionCode } from '../../domain';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';

export type CheckUserPermissionQueryProps = {
  readonly userId: string;
  readonly permissionCode: string;
};

export class CheckUserPermissionQuery {
  constructor(readonly props: CheckUserPermissionQueryProps) {}
}

@Injectable()
export class CheckUserPermissionHandler {
  constructor(@Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository) {}

  async execute(query: CheckUserPermissionQuery): Promise<boolean> {
    const permissionCode = PermissionCode.create(query.props.permissionCode);
    return this.userAccess.userHasPermission(query.props.userId, permissionCode.value);
  }
}
