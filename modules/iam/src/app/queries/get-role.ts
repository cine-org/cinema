import { Injectable } from '@nestjs/common';
import { RoleNotFoundException } from '../../domain';
import { IamReadRepository } from '../ports';
import type { RoleView } from '../views';

export class GetRoleQuery {
  constructor(readonly roleId: string) {}
}

@Injectable()
export class GetRoleHandler {
  constructor(private readonly iam: IamReadRepository) {}

  async execute(query: GetRoleQuery): Promise<RoleView> {
    const role = await this.iam.findRole(query.roleId);

    if (!role) {
      throw new RoleNotFoundException();
    }

    return role;
  }
}
