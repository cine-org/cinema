import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../../domain';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';

export class GetUserRolesQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserRolesHandler {
  constructor(@Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository) {}

  async execute(query: GetUserRolesQuery): Promise<Role[]> {
    return this.userAccess.getUserRoles(query.userId);
  }
}
