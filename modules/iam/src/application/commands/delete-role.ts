import { Inject, Injectable } from '@nestjs/common';
import { RoleNotFoundException } from '../../domain';
import { ROLE_REPOSITORY, type RoleRepository } from '../ports';

export class DeleteRoleCommand {
  constructor(readonly roleId: string) {}
}

@Injectable()
export class DeleteRoleHandler {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository) {}

  async execute(command: DeleteRoleCommand): Promise<void> {
    const role = await this.roles.findById(command.roleId);

    if (!role) {
      throw new RoleNotFoundException();
    }

    role.assertCustom();
    await this.roles.delete(role.id);
  }
}
