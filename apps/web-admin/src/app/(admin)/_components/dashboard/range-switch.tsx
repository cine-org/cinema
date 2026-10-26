import Link from 'next/link';
import { cn } from '@/lib/utils';
import { RANGES, RANGE_INFO, type Range } from '../../_data/mock-dashboard';

export const RangeSwitch = ({ current }: { current: Range }) => (
  <nav aria-label="Report range" className="inline-flex rounded-lg border border-border p-1">
    {RANGES.map((range) => (
      <Link
        key={range}
        href={range === 'today' ? '/' : `/?range=${range}`}
        aria-current={range === current ? 'page' : undefined}
        className={cn(
          'rounded-md px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground',
          range === current && 'bg-muted text-foreground',
        )}
      >
        {RANGE_INFO[range].label}
      </Link>
    ))}
  </nav>
);
