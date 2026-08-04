import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
  type UsersPage,
  type UsersPageFilter,
} from '../ports';

export class GetUsersPageQuery {
  constructor(readonly filter: UsersPageFilter = {}) {}
}

@Injectable()
export class GetUsersPageHandler {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(query: GetUsersPageQuery): Promise<UsersPage> {
    return this.users.paginate(query.filter);
  }
}
