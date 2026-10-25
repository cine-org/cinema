'use client';

import { Download, RotateCcw, ListFilter } from 'lucide-react';
import { useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DebouncedSearch } from '@/components/data-table/debounced-search';
import { STATUS_VALUES } from '../_data/user';
import { type UsersQuery, DEFAULT_QUERY } from '../_data/users-query';
import { ROLE_LABELS, ROLE_VALUES } from '@/lib/roles';
import type { Noun } from './noun';
import { STATUS_LABELS } from './status-badge';
import { useUsersNav } from './use-users-nav';

const VERIFIED_OPTIONS = [
  { value: 'verified', label: 'Verified' },
  { value: 'unverified', label: 'Unverified' },
] as const;

// ticking an item toggles it in the list; the menu stays open so several can be ticked
const toggle = <T extends string>(list: T[], value: T, on: boolean) =>
  on ? [...list, value] : list.filter((v) => v !== value);

export const UsersToolbar = ({
  query,
  noun,
  roleFilter = false,
}: {
  query: UsersQuery;
  noun: Noun;
  roleFilter?: boolean;
}) => {
  const go = useUsersNav(query);
  const search = useCallback((q: string) => go({ q }, 'replace'), [go]);

  const activeFilters =
    query.verified.length + query.status.length + query.role.length + (query.showDeleted ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
      <DebouncedSearch
        className="w-64"
        aria-label={`Search ${noun.plural}`}
        placeholder="Name or email"
        value={query.q}
        onSearch={search}
      />

      <div className="flex flex-wrap items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="relative h-10 w-36">
              <ListFilter />
              Filters
              {/* overlaid on the corner so the button keeps its width with or without a count */}
              {activeFilters > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 min-w-5 rounded-full px-1 tabular-nums">
                  {activeFilters}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={activeFilters === 0}
              onSelect={(e) => {
                e.preventDefault();
                go({
                  verified: DEFAULT_QUERY.verified,
                  status: DEFAULT_QUERY.status,
                  role: DEFAULT_QUERY.role,
                  showDeleted: DEFAULT_QUERY.showDeleted,
                });
              }}
            >
              <RotateCcw />
              Clear filters
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Email</DropdownMenuLabel>
            {VERIFIED_OPTIONS.map(({ value, label }) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={query.verified.includes(value)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(on) => go({ verified: toggle(query.verified, value, on) })}
              >
                {label}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Status</DropdownMenuLabel>
            {STATUS_VALUES.map((value) => (
              <DropdownMenuCheckboxItem
                key={value}
                checked={query.status.includes(value)}
                onSelect={(e) => e.preventDefault()}
                onCheckedChange={(on) => go({ status: toggle(query.status, value, on) })}
              >
                {STATUS_LABELS[value]}
              </DropdownMenuCheckboxItem>
            ))}
            {roleFilter && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Role</DropdownMenuLabel>
                {ROLE_VALUES.map((value) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={query.role.includes(value)}
                    onSelect={(e) => e.preventDefault()}
                    onCheckedChange={(on) => go({ role: toggle(query.role, value, on) })}
                  >
                    {ROLE_LABELS[value]}
                  </DropdownMenuCheckboxItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Deleted</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={query.showDeleted}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={(on) => go({ showDeleted: on })}
            >
              Show deleted
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* TODO: export the current list as CSV once the api supports it */}
        <Button variant="outline" className="h-10">
          <Download />
          Export CSV
        </Button>
      </div>
    </div>
  );
};
