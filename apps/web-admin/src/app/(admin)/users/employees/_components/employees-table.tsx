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
import type { Employee } from '../_data/mock-employees';
import { SCOPE_LABELS } from '@/lib/roles';
import { RoleBadge } from './role-badge';
import { EmployeeSheet } from './employee-sheet';

const NOUN: Noun = { singular: 'employee', plural: 'employees' };

type Props = { query: UsersQuery; rows: Employee[]; total: number };

export const EmployeesTable = ({ query, rows, total }: Props) => {
  const sortBy = useSortBy(query);
  const go = useUsersNav(query);
  const sort = { field: query.sort, dir: query.dir };
  const [selected, setSelected] = useState<Employee | null>(null);

  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/15">
      <UsersToolbar query={query} noun={NOUN} roleFilter />

      {/* fixed column widths and a minimum height keep the layout still; narrow screens drop columns instead of scrolling */}
      <div style={{ minHeight: listMinHeight(query.limit) }}>
        <Table className="table-fixed">
          <TableHeader>
            <TableRow>
              <SortHead field="fullName" sort={sort} onSort={sortBy} className="pl-4">
                Employee
              </SortHead>
              <TableHead className="hidden w-32 lg:table-cell">Email</TableHead>
              <TableHead className="hidden w-44 md:table-cell">Role</TableHead>
              <TableHead className="hidden w-36 xl:table-cell">Scope</TableHead>
              <SortHead
                field="createdAt"
                sort={sort}
                onSort={sortBy}
                className="hidden w-36 2xl:table-cell"
              >
                Created
              </SortHead>
              <TableHead className="w-44">Status</TableHead>
              <TableHead className="w-14" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((s) => (
              <TableRow key={s.id} className={cn('h-14', s.deletedAt !== null && 'opacity-60')}>
                <TableCell className="pl-4">
                  <UserCell user={s} />
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <VerifiedBadge verified={s.isEmailVerified} />
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <RoleBadge role={s.role} />
                </TableCell>
                <TableCell className="hidden truncate text-muted-foreground xl:table-cell">
                  {SCOPE_LABELS[s.scope]}
                </TableCell>
                <TableCell className="hidden text-muted-foreground 2xl:table-cell">
                  {formatDate(s.createdAt)}
                </TableCell>
                <TableCell>
                  <StatusBadge status={s.status} deleted={s.deletedAt !== null} />
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="View employee"
                    onClick={() => setSelected(s)}
                  >
                    <ChevronRight />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No employees match.
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
      <EmployeeSheet noun={NOUN} employee={selected} onClose={() => setSelected(null)} />
    </div>
  );
};
