'use client';

import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/format-date';
import type { Noun } from '../../_components/noun';
import { Pagination } from '@/components/data-table/pagination';
import { SortHead } from '@/components/data-table/sort-head';
import { StatusBadge } from '../../_components/status-badge';
import { listMinHeight } from '@/components/data-table/table-layout';
import { UserCell } from '../../_components/user-cell';
import { useSortBy, useUsersNav } from '../../_components/use-users-nav';
import { UsersToolbar } from '../../_components/users-toolbar';
import { VerifiedBadge } from '../../_components/verified-badge';
import type { UsersQuery } from '../../_data/users-query';
import type { Customer } from '../_data/mock-customers';
import { CustomerSheet } from './customer-sheet';

const NOUN: Noun = { singular: 'customer', plural: 'customers' };

type Props = { query: UsersQuery; rows: Customer[]; total: number };

export const CustomersTable = ({ query, rows, total }: Props) => {
  const sortBy = useSortBy(query);
  const go = useUsersNav(query);
  const sort = { field: query.sort, dir: query.dir };
  const [selected, setSelected] = useState<Customer | null>(null);

  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/15">
      <UsersToolbar query={query} noun={NOUN} />

      {/* fixed column widths and a minimum height keep the layout still; narrow screens drop columns instead of scrolling */}
      <div style={{ minHeight: listMinHeight(query.limit) }}>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <SortHead field="fullName" sort={sort} onSort={sortBy} className="pl-4">
                Customer
              </SortHead>
              <TableHead className="hidden w-32 md:table-cell">Email</TableHead>
              <SortHead
                field="dateOfBirth"
                sort={sort}
                onSort={sortBy}
                className="hidden w-36 xl:table-cell"
              >
                Date of birth
              </SortHead>
              <SortHead
                field="createdAt"
                sort={sort}
                onSort={sortBy}
                className="hidden w-36 lg:table-cell"
              >
                Created
              </SortHead>
              <TableHead className="w-44">Status</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((c) => (
              <TableRow key={c.id} className={cn('h-14', c.deletedAt !== null && 'opacity-60')}>
                <TableCell className="pl-4">
                  <UserCell user={c} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <VerifiedBadge verified={c.isEmailVerified} />
                </TableCell>
                <TableCell className="hidden text-muted-foreground xl:table-cell">
                  {formatDate(c.dateOfBirth)}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {formatDate(c.createdAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={c.status} deleted={c.deletedAt !== null} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="View customer"
                    onClick={() => setSelected(c)}
                  >
                    <ChevronRight />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No customers match.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Pagination
        page={query.page}
        limit={query.limit}
        total={total}
        onPage={(page) => go({ page })}
        onLimit={(limit) => go({ limit })}
      />
      <CustomerSheet noun={NOUN} customer={selected} onClose={() => setSelected(null)} />
    </div>
  );
};
