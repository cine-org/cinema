import { Inject, Injectable } from '@nestjs/common';
import { type Permission, PermissionNotFoundException } from '../../domain';
import { PERMISSION_REPOSITORY, type PermissionRepository } from '../ports';

export class GetPermissionByIdQuery {
  constructor(readonly permissionId: string) {}
}

@Injectable()
export class GetPermissionByIdHandler {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async execute(query: GetPermissionByIdQuery): Promise<Permission> {
    const permission = await this.permissions.findById(query.permissionId);

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    return permission;
  }
}
