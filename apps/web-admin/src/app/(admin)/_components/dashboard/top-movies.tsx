import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MovieRow } from '../../_data/mock-dashboard';

export const TopMovies = ({ rows }: { rows: MovieRow[] }) => (
  <Card>
    <CardHeader>
      <CardTitle>Top movies</CardTitle>
    </CardHeader>
    <CardContent>
      <ol className="space-y-5">
        {rows.map((m, i) => (
          <li key={m.title} className="flex items-start gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium tabular-nums">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate font-medium">{m.title}</span>
                <span className="shrink-0 tabular-nums">{m.revenue}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted" aria-hidden>
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${m.share * 100}%` }}
                />
              </div>
              <div className="text-xs text-muted-foreground tabular-nums">
                {m.tickets} tickets, {m.occupancy}% occupancy
              </div>
            </div>
          </li>
        ))}
      </ol>
    </CardContent>
  </Card>
);
