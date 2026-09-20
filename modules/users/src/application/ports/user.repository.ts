import type { User, UserStatusValue } from '../../domain';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export type UserStatusFilter = UserStatusValue | 'all';

export type UsersPageFilter = {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: UserStatusFilter;
  readonly search?: string;
};

export type UsersPage = {
  readonly items: User[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
};

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  paginate(filter?: UsersPageFilter): Promise<UsersPage>;
  updateProfile(user: User): Promise<void>;
  updateStatus(user: User): Promise<void>;
}
