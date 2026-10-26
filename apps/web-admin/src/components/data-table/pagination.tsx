'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LIMIT_OPTIONS } from '@/lib/list-query';

// first, last, the current page and its neighbours; gaps become null (an ellipsis)
const pageItems = (page: number, count: number): (number | null)[] => {
  const keep = new Set([1, count, page - 1, page, page + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...keep].sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? [null, p] : [p]));
};

type Props = {
  page: number;
  limit: number;
  total: number;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
};

export const Pagination = ({ page, limit, total, onPage, onLimit }: Props) => {
  const pageCount = Math.max(1, Math.ceil(total / limit));
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border p-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span>Rows per page</span>
          <Select value={String(limit)} onValueChange={(v) => onLimit(Number(v))}>
            <SelectTrigger size="sm" aria-label="Rows per page" className="w-18">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map((l) => (
                <SelectItem key={l} value={String(l)}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span>
          {first}–{last} of {total}
        </span>
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="First page"
          disabled={page <= 1}
          onClick={() => onPage(1)}
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft />
        </Button>
        {pageItems(page, pageCount).map((item, i) =>
          item === null ? (
            <span key={`gap-${i}`} aria-hidden className="w-7 text-center">
              …
            </span>
          ) : (
            <Button
              key={item}
              variant={item === page ? 'default' : 'ghost'}
              size="icon-sm"
              aria-label={`Page ${item}`}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onPage(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Next page"
          disabled={page >= pageCount}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          aria-label="Last page"
          disabled={page >= pageCount}
          onClick={() => onPage(pageCount)}
        >
          <ChevronsRight />
        </Button>
      </nav>
    </div>
  );
};
