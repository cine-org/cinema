import {
  DEFAULT_LIMIT,
  list,
  one,
  parsePaging,
  pick,
  setPaging,
  type RawParams,
  type SortDir,
} from '@/lib/list-query';
import { ROLE_VALUES, type EmployeeRole } from '@/lib/roles';
import { STATUS_VALUES, type UserStatus } from './user';

const VERIFIED_VALUES = ['verified', 'unverified'] as const;
type VerifiedValue = (typeof VERIFIED_VALUES)[number];
const SORT_FIELDS = ['fullName', 'dateOfBirth', 'createdAt'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export type UsersQuery = {
  q: string;
  verified: VerifiedValue[];
  status: UserStatus[];
  role: EmployeeRole[];
  showDeleted: boolean;
  sort: SortField;
  dir: SortDir;
  page: number;
  limit: number;
};

export const DEFAULT_QUERY: UsersQuery = {
  q: '',
  verified: [],
  status: [],
  role: [],
  showDeleted: false,
  sort: 'createdAt',
  dir: 'desc',
  page: 1,
  limit: DEFAULT_LIMIT,
};

export const parseUsersQuery = (params: RawParams): UsersQuery => {
  const [field, dir] = (one(params.sort) ?? '').split(':');
  return {
    q: (one(params.q) ?? '').trim(),
    verified: list(params.verified, VERIFIED_VALUES),
    status: list(params.status, STATUS_VALUES),
    role: list(params.role, ROLE_VALUES),
    showDeleted: one(params.deleted) === 'show',
    sort: pick(field, SORT_FIELDS, DEFAULT_QUERY.sort),
    dir: pick(dir, ['asc', 'desc'], DEFAULT_QUERY.dir),
    ...parsePaging(params),
  };
};

// params equal to their default are left out to keep the URL short
export const serializeUsersQuery = (query: UsersQuery) => {
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.verified.length) params.set('verified', query.verified.join(','));
  if (query.status.length) params.set('status', query.status.join(','));
  if (query.role.length) params.set('role', query.role.join(','));
  if (query.showDeleted) params.set('deleted', 'show');
  if (query.sort !== DEFAULT_QUERY.sort || query.dir !== DEFAULT_QUERY.dir) {
    params.set('sort', `${query.sort}:${query.dir}`);
  }
  setPaging(params, query);
  return params.toString();
};
