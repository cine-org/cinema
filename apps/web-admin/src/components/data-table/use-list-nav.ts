'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback } from 'react';

// Returns a function that moves the list to a new query by changing the URL.
// Any change except paging goes back to page 1.
export const useListNav = <Q extends { page: number }>(query: Q, serialize: (q: Q) => string) => {
  const router = useRouter();
  const pathname = usePathname();

  // a stable identity keeps the search box's debounce effect from restarting on every render
  return useCallback(
    (patch: Partial<Q>, mode: 'push' | 'replace' = 'push') => {
      const qs = serialize({ ...query, page: 1, ...patch });
      router[mode](qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [query, serialize, pathname, router],
  );
};
