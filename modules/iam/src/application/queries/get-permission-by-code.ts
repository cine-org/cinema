import { Inject, Injectable } from '@nestjs/common';
import { type Permission, PermissionCode, PermissionNotFoundException } from '../../domain';
import { PERMISSION_REPOSITORY, type PermissionRepository } from '../ports';

export class GetPermissionByCodeQuery {
  constructor(readonly code: string) {}
}

@Injectable()
export class GetPermissionByCodeHandler {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async execute(query: GetPermissionByCodeQuery): Promise<Permission> {
    const permission = await this.permissions.findByCode(PermissionCode.create(query.code).value);

    if (!permission) {
      throw new PermissionNotFoundException();
    }

    return permission;
  }
}
