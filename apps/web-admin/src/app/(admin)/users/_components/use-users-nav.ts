'use client';

import { useListNav } from '@/components/data-table/use-list-nav';
import { type SortField, type UsersQuery, serializeUsersQuery } from '../_data/users-query';

export const useUsersNav = (query: UsersQuery) => useListNav(query, serializeUsersQuery);

// Returns the handler for clicking a sortable column header.
export const useSortBy = (query: UsersQuery) => {
  const go = useUsersNav(query);

  return (field: SortField) => {
    // a new column starts in its natural order, the same column flips
    const natural = field === 'fullName' ? 'asc' : 'desc';
    const dir = query.sort === field ? (query.dir === 'asc' ? 'desc' : 'asc') : natural;
    go({ sort: field, dir });
  };
};
