import { Injectable } from '@nestjs/common';
import { Role, type RoleScope } from '../../domain';
import { RoleRepository } from '../ports';

export type CreateRoleCommandProps = {
  readonly key: string;
  readonly name: string;
  readonly scopes: readonly RoleScope[];
  // A copy of a role passes that role's permissions.
  readonly permissions: readonly string[];
};

export class CreateRoleCommand {
  constructor(readonly props: CreateRoleCommandProps) {}
}

@Injectable()
export class CreateRoleHandler {
  constructor(private readonly roles: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<{ id: string }> {
    const active = new Set(await this.roles.listPermissions());
    const role = Role.create({ id: crypto.randomUUID(), ...command.props, active });
    await this.roles.create(role);
    return { id: role.id };
  }
}
