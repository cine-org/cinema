import { Inject, Injectable } from '@nestjs/common';
import { RoleNotFoundException } from '../../domain';
import { ROLE_REPOSITORY, type RoleRepository } from '../ports';

export type UpdateRoleCommandProps = {
  readonly roleId: string;
  readonly name?: string | null;
  readonly description?: string | null;
};

export class UpdateRoleCommand {
  constructor(readonly props: UpdateRoleCommandProps) {}
}

@Injectable()
export class UpdateRoleHandler {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(command: UpdateRoleCommand): Promise<void> {
    const role = await this.roles.findById(command.props.roleId);

    if (!role) {
      throw new RoleNotFoundException();
    }

    await this.roles.update(
      role.update({
        name: command.props.name,
        description: command.props.description,
        updatedAt: new Date(),
      }),
    );
  }
}
