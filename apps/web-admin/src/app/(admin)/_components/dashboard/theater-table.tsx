import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { TheaterRow } from '../../_data/mock-dashboard';

// a grid instead of a table: it reflows on phones, so nothing scrolls sideways
const ROW = 'grid grid-cols-[1fr_auto] items-center gap-x-4 md:grid-cols-[1fr_6rem_6rem_9rem_5rem]';

export const TheaterTable = ({ rows }: { rows: TheaterRow[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Revenue by theater</CardTitle>
    </CardHeader>
    <CardContent>
      <div
        className={cn(
          ROW,
          'hidden border-b border-border pb-2 text-sm text-muted-foreground md:grid',
        )}
      >
        <span>Theater</span>
        <span>Revenue</span>
        <span>Tickets</span>
        <span>Occupancy</span>
        <span>Change</span>
      </div>
      <ul className="divide-y divide-border">
        {rows.map((t) => {
          const Icon = t.delta.up ? TrendingUp : TrendingDown;
          return (
            <li key={t.name} className={cn(ROW, 'gap-y-1 py-3')}>
              <span className="font-medium">{t.name}</span>
              <span className="text-right tabular-nums md:text-left">{t.revenue}</span>
              <span className="hidden text-sm tabular-nums md:block">{t.tickets}</span>
              <div className="col-span-2 flex items-center gap-2 md:col-span-1">
                <div
                  className="h-2 flex-1 rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`${t.name} occupancy`}
                  aria-valuenow={t.occupancy}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${t.occupancy}%` }}
                  />
                </div>
                <span className="w-9 text-right text-sm tabular-nums">{t.occupancy}%</span>
              </div>
              <span
                className={cn(
                  'hidden items-center gap-1 text-sm font-medium md:inline-flex',
                  t.delta.up
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400',
                )}
              >
                <Icon className="size-4" />
                {t.delta.text}
              </span>
            </li>
          );
        })}
      </ul>
    </CardContent>
  </Card>
);
