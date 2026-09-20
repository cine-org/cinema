import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../../domain';
import { USER_ACCESS_REPOSITORY, type UserAccessRepository } from '../ports';
import { DatabaseClient } from '@repo/database';
import { UserNotFoundException } from '@repo/users';

export class GetUserRolesQuery {
  constructor(readonly userId: string) {}
}

@Injectable()
export class GetUserRolesHandler {
  constructor(
    @Inject(USER_ACCESS_REPOSITORY) private readonly userAccess: UserAccessRepository,
    private readonly db: DatabaseClient,
  ) {}

  async execute(query: GetUserRolesQuery): Promise<Role[]> {
    if (!(await this.db.user.findUnique({ where: { id: query.userId }, select: { id: true } })))
      throw new UserNotFoundException();
    return this.userAccess.getUserRoles(query.userId);
  }
}
