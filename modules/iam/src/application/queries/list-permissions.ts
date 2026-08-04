import { Inject, Injectable } from '@nestjs/common';
import type { Permission } from '../../domain';
import {
  PERMISSION_REPOSITORY,
  type PermissionListFilter,
  type PermissionRepository,
} from '../ports';

export class ListPermissionsQuery {
  constructor(readonly filter: PermissionListFilter = {}) {}
}

@Injectable()
export class ListPermissionsHandler {
  constructor(@Inject(PERMISSION_REPOSITORY) private readonly permissions: PermissionRepository) {}

  async execute(query: ListPermissionsQuery): Promise<Permission[]> {
    return this.permissions.list(query.filter);
  }
}
