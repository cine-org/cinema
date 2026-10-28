import { Injectable } from '@nestjs/common';
import { IamReadRepository } from '../ports';
import type { RoleView } from '../views';

export class ListRolesQuery {}

// Internal roles, system ones first.
@Injectable()
export class ListRolesHandler {
  constructor(private readonly iam: IamReadRepository) {}

  async execute(_query: ListRolesQuery): Promise<RoleView[]> {
    return this.iam.listRoles();
  }
}
