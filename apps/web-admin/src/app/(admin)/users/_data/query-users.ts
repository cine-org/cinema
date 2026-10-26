import type { UsersQuery } from './users-query';
import type { EmployeeRole } from '@/lib/roles';
import type { User } from './user';

// TODO: replace with the admin api call; it filters, sorts and pages the same way
// the optional fields exist on only one kind of user; the others never match or sort on them
type Listed = User & { dateOfBirth?: string | null; role?: EmployeeRole };

export const queryUsers = <T extends Listed>(
  query: UsersQuery,
  source: T[],
): { rows: T[]; total: number; page: number } => {
  const q = query.q.toLowerCase();
  const matched = source.filter(
    (c) =>
      (!query.verified.length ||
        query.verified.includes(c.isEmailVerified ? 'verified' : 'unverified')) &&
      (query.showDeleted || c.deletedAt === null) &&
      (!query.role.length || (c.role !== undefined && query.role.includes(c.role))) &&
      (!query.status.length || query.status.includes(c.status)) &&
      (!q ||
        (c.fullName ?? '').toLowerCase().includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)),
  );

  const sign = query.dir === 'asc' ? 1 : -1;
  const sorted = matched.toSorted((a, b) => {
    const av = a[query.sort];
    const bv = b[query.sort];
    if (av === bv) return 0;
    if (av == null) return 1; // empty values go last in both directions
    if (bv == null) return -1;
    return av.localeCompare(bv) * sign;
  });

  // a page past the end falls back to the last one
  const pageCount = Math.max(1, Math.ceil(sorted.length / query.limit));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.limit;
  return { rows: sorted.slice(start, start + query.limit), total: sorted.length, page };
};
