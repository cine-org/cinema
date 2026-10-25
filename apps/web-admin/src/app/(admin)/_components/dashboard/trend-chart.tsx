'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEAT_TYPES, type TrendPoint } from '../../_data/mock-dashboard';

const METRICS = [
  { key: 'revenue', label: 'Revenue', unit: 'M ₫' },
  { key: 'tickets', label: 'Tickets', unit: 'tickets' },
] as const;

const SEGMENT = ['bg-primary', 'bg-primary/55', 'bg-primary/25'];

// a round axis top and step, so the grid lines land on readable numbers
const axis = (max: number) => {
  const raw = max / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? power * 10;
  return { step, top: Math.ceil(max / step) * step };
};

export const TrendChart = ({ points }: { points: TrendPoint[] }) => {
  const [metric, setMetric] = useState<(typeof METRICS)[number]>(METRICS[0]);
  const totals = points.map((p) => p[metric.key].reduce((a, b) => a + b, 0));
  const { step, top } = axis(Math.max(...totals));
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => top - i * step);
  const dense = points.length > 12;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trend by seat type</CardTitle>
        <CardAction>
          <div
            className="inline-flex rounded-lg border border-border p-1"
            role="group"
            aria-label="Metric"
          >
            {METRICS.map((m) => (
              <button
                key={m.key}
                type="button"
                aria-pressed={m.key === metric.key}
                onClick={() => setMetric(m)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground',
                  m.key === metric.key && 'bg-muted text-foreground',
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="img"
          aria-label={`${metric.label} per point (${metric.unit}): ${points.map((p, i) => `${p.label} ${totals[i]}`).join(', ')}`}
          className="flex gap-3"
        >
          <div className="flex h-56 flex-col justify-between text-xs text-muted-foreground tabular-nums">
            {ticks.map((t) => (
              <span key={t} className="leading-none">
                {t}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <div className="absolute inset-0 flex h-56 flex-col justify-between" aria-hidden>
              {ticks.map((t) => (
                <div key={t} className="border-t border-dashed border-border" />
              ))}
            </div>
            <div
              className={cn('relative flex h-56 items-end', dense ? 'gap-0.5' : 'gap-2 sm:gap-4')}
            >
              {points.map((p, i) => (
                <div key={p.label} className="flex h-full flex-1 flex-col items-center justify-end">
                  {!dense && (
                    <span className="mb-1 text-xs text-muted-foreground tabular-nums">
                      {totals[i]}
                    </span>
                  )}
                  <div
                    className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md"
                    style={{ height: `${(totals[i] / top) * 100}%` }}
                    title={`${p.label}: ${totals[i]} ${metric.unit}`}
                  >
                    {p[metric.key].map((v, s) => (
                      <div
                        key={s}
                        className={SEGMENT[s]}
                        style={{ height: `${(v / totals[i]) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className={cn('mt-2 flex', dense ? 'gap-0.5' : 'gap-2 sm:gap-4')}>
              {points.map((p, i) => (
                <span key={p.label} className="flex-1 text-center text-xs text-muted-foreground">
                  {!dense || i % 5 === 0 ? p.label : ''}
                </span>
              ))}
            </div>
          </div>
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
          {SEAT_TYPES.map((type, s) => (
            <li key={type} className="flex items-center gap-2">
              <span className={cn('size-3 rounded-sm', SEGMENT[s])} aria-hidden />
              {type}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
