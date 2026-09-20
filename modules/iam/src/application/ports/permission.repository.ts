import type { Permission } from '../../domain';

export const PERMISSION_REPOSITORY = Symbol('PERMISSION_REPOSITORY');

export type PermissionListFilter = {
  readonly search?: string;
};

export interface PermissionRepository {
  findById(id: string): Promise<Permission | null>;
  findByCode(code: string): Promise<Permission | null>;
  list(filter?: PermissionListFilter): Promise<Permission[]>;
  save(permission: Permission): Promise<void>;
  update(permission: Permission): Promise<void>;
}
