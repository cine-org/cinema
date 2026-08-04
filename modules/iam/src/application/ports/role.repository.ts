import type { Role, RoleTypeValue } from '../../domain';

export const ROLE_REPOSITORY = Symbol('ROLE_REPOSITORY');

export type RoleListFilter = {
  readonly type?: RoleTypeValue;
  readonly search?: string;
};

export interface RoleRepository {
  findById(id: string): Promise<Role | null>;
  findByCode(code: string): Promise<Role | null>;
  list(filter?: RoleListFilter): Promise<Role[]>;
  save(role: Role): Promise<void>;
  update(role: Role): Promise<void>;
  delete(id: string): Promise<void>;
}
