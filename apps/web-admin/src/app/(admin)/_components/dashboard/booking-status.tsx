import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BookingStatus } from '../../_data/mock-dashboard';

const COLORS: Record<BookingStatus['label'], string> = {
  Confirmed: 'bg-primary',
  Cancelled: 'bg-primary/45',
  Refunded: 'bg-primary/20',
};

export const BookingStatusCard = ({ rows }: { rows: BookingStatus[] }) => {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Booking status</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="text-3xl font-semibold tracking-tight tabular-nums">
          {total.toLocaleString('en-US')}
          <span className="ml-2 text-sm font-normal text-muted-foreground">bookings</span>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
          {rows.map((r) => (
            <div
              key={r.label}
              className={COLORS[r.label]}
              style={{ width: `${(r.value / total) * 100}%` }}
            />
          ))}
        </div>
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className={cn('size-3 rounded-sm', COLORS[r.label])} aria-hidden />
                {r.label}
              </span>
              <span className="tabular-nums">
                {r.value.toLocaleString('en-US')}
                <span className="ml-2 text-muted-foreground">
                  {((r.value / total) * 100).toFixed(1)}%
                </span>
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
