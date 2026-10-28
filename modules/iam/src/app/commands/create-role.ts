import { Injectable } from '@nestjs/common';
import { Role, type RoleScope } from '../../domain';
import { RoleRepository } from '../ports';

// Duplicating a role is creating one with the source role's permissions.
export class CreateRoleCommand {
  constructor(
    readonly key: string,
    readonly name: string,
    readonly scopes: readonly RoleScope[],
    readonly permissions: readonly string[],
  ) {}
}

@Injectable()
export class CreateRoleHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<{ roleId: string }> {
    const catalog = await this.roles.findCatalog();
    const role = Role.create(command, catalog);
    await this.roles.create(role);
    return { roleId: role.id };
  }
}
