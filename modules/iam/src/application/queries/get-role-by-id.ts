import { Inject, Injectable } from '@nestjs/common';
import { type Role, RoleNotFoundException } from '../../domain';
import { ROLE_REPOSITORY, type RoleRepository } from '../ports';

export class GetRoleByIdQuery {
  constructor(readonly roleId: string) {}
}

@Injectable()
export class GetRoleByIdHandler {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(query: GetRoleByIdQuery): Promise<Role> {
    const role = await this.roles.findById(query.roleId);

    if (!role) {
      throw new RoleNotFoundException();
    }

    return role;
  }
}
