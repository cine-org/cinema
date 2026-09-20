import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../../domain';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';
import { DatabaseClient } from '@repo/database';
import { UserNotFoundException } from '@repo/users';

export class GetUserPermissionsQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserPermissionsHandler {
  constructor(
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(query: GetUserPermissionsQuery): Promise<Permission[]> {
    if (!(await this.db.user.findUnique({ where: { id: query.userId }, select: { id: true } })))
      throw new UserNotFoundException();
    return this.userAccess.getUserPermissions(query.userId);
  }
}
