'use client';

import { ChevronDown, Plus } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format-date';
import type { LayoutStatus, LayoutVersion } from '../../../../_data/types';
import { LayoutStatusBadge } from './layout-status-badge';

type Props = {
  versions: LayoutVersion[];
  // 'new' is the draft that is not stored yet
  current: number | 'new';
  baseHref: string;
  canCreateDraft: boolean;
};

const dateOf = (v: LayoutVersion | undefined) =>
  !v ? 'Not saved' : v.publishedAt ? formatDate(v.publishedAt) : 'Unpublished';

// one line per version: number, status and when it was published, so the right side is never empty
const Line = ({ label, status, date }: { label: string; status: LayoutStatus; date: string }) => (
  <>
    <span className="w-7 tabular-nums">{label}</span>
    <LayoutStatusBadge status={status} />
    <span className="ml-auto text-xs text-muted-foreground tabular-nums">{date}</span>
  </>
);

// the versions are links, so the leave guard on an editor with unsaved changes can stop a switch
export const VersionPicker = ({ versions, current, baseHref, canCreateDraft }: Props) => {
  const shown = current === 'new' ? undefined : versions.find((v) => v.version === current);

  return (
    <div className="min-w-0 pb-1">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex h-9 w-full min-w-0 items-center gap-2 rounded-md border border-input px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
          <Line
            label={current === 'new' ? 'New' : `v${current}`}
            status={shown?.status ?? 'draft'}
            date={dateOf(shown)}
          />
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
          {versions.map((v) => (
            <DropdownMenuItem
              key={v.version}
              asChild
              className={cn('py-2', v.version === current && 'bg-muted font-medium')}
            >
              <Link href={`${baseHref}?layout=${v.version}`} className="gap-2.5">
                <Line label={`v${v.version}`} status={v.status} date={dateOf(v)} />
              </Link>
            </DropdownMenuItem>
          ))}
          {canCreateDraft && (
            <>
              {versions.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem asChild className="py-2">
                <Link href={`${baseHref}?layout=new`} className="gap-2.5">
                  <Plus />
                  New draft
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
