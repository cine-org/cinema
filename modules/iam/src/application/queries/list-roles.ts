import { Inject, Injectable } from '@nestjs/common';
import type { Role } from '../../domain';
import { ROLE_REPOSITORY, type RoleListFilter, type RoleRepository } from '../ports';

export class ListRolesQuery {
  constructor(readonly filter: RoleListFilter = {}) {}
}

@Injectable()
export class ListRolesHandler {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(query: ListRolesQuery): Promise<Role[]> {
    return this.roles.list(query.filter);
  }
}
