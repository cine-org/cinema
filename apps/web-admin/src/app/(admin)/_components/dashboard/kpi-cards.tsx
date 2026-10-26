import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import type { Kpi } from '../../_data/mock-dashboard';
import { Sparkline } from './sparkline';

export const KpiCards = ({ kpis, compare }: { kpis: Kpi[]; compare: string }) => (
  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {kpis.map(({ label, value, delta, spark }) => {
      const Icon = delta.up ? TrendingUp : TrendingDown;
      return (
        <Card key={label}>
          <CardContent className="space-y-3">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="flex items-end justify-between gap-3">
              <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
              <Sparkline values={spark} />
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-medium',
                  delta.good
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400',
                )}
              >
                <Icon className="size-4" />
                {delta.text}
              </span>
              <span className="text-muted-foreground">{compare}</span>
            </div>
          </CardContent>
        </Card>
      );
    })}
  </div>
);
