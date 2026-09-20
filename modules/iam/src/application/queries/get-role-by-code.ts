import { Inject, Injectable } from '@nestjs/common';
import { type Role, RoleCode, RoleNotFoundException } from '../../domain';
import { ROLE_REPOSITORY, type RoleRepository } from '../ports';

export class GetRoleByCodeQuery {
  constructor(readonly code: string) {}
}

@Injectable()
export class GetRoleByCodeHandler {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(query: GetRoleByCodeQuery): Promise<Role> {
    const role = await this.roles.findByCode(RoleCode.create(query.code).value);

    if (!role) {
      throw new RoleNotFoundException();
    }

    return role;
  }
}
