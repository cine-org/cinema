import { Inject, Injectable } from '@nestjs/common';
import { PermissionNotFoundException } from '../../domain';
import { PERMISSION_REPOSITORY, type PermissionRepository } from '../ports';

export type UpdatePermissionCommandProps = {
  readonly permissionId: string;
  readonly description?: string | null;
};

export class UpdatePermissionCommand {
  constructor(readonly props: UpdatePermissionCommandProps) {}
}

@Injectable()
export class UpdatePermissionHandler {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async execute(command: UpdatePermissionCommand): Promise<void> {
    const permission = await this.permissions.findById(command.props.permissionId);

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    await this.permissions.update(
      permission.update({
        description: command.props.description,
        updatedAt: new Date(),
      }),
    );
  }
}
