import { Inject, Injectable } from '@nestjs/common';
import { Role, RoleAlreadyExistsException, RoleCode } from '../../domain';
import { ROLE_REPOSITORY, type RoleRepository } from '../ports';

export type CreateRoleCommandProps = {
  readonly id: string;
  readonly code: string;
  readonly name?: string | null;
  readonly description?: string | null;
};

export class CreateRoleCommand {
  constructor(readonly props: CreateRoleCommandProps) {}
}

@Injectable()
export class CreateRoleHandler {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(command: CreateRoleCommand): Promise<void> {
    const code = RoleCode.create(command.props.code);
    const existing = await this.roles.findByCode(code.value);

    if (existing) {
      throw new RoleAlreadyExistsException();
    }

    const now = new Date();
    const role = Role.create({
      id: command.props.id,
      code,
      name: command.props.name,
      description: command.props.description,
      now,
    });

    await this.roles.save(role);
  }
}
