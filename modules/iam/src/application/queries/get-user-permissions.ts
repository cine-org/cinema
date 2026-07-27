import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../../domain';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';

export class GetUserPermissionsQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserPermissionsHandler {
  constructor(@Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository) {}

  async execute(query: GetUserPermissionsQuery): Promise<Permission[]> {
    return this.userAccess.getUserPermissions(query.userId);
  }
}
