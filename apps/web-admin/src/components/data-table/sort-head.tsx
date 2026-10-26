import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { TableHead } from '@/components/ui/table';
import type { SortDir } from '@/lib/list-query';

type Props<F extends string> = {
  field: F;
  sort: { field: F; dir: SortDir };
  onSort: (field: F) => void;
  className?: string;
  children: string;
};

export const SortHead = <F extends string>({
  field,
  sort,
  onSort,
  className,
  children,
}: Props<F>) => {
  const current = sort.field === field;
  const Icon = !current ? ChevronsUpDown : sort.dir === 'asc' ? ArrowUp : ArrowDown;

  return (
    <TableHead
      className={className}
      aria-sort={current ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {children}
        <Icon className={current ? 'size-3.5' : 'size-3.5 opacity-50'} />
      </button>
    </TableHead>
  );
};
