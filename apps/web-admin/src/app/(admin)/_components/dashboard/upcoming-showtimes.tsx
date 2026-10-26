import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ToneBadge, type Tone } from '@/components/tone-badge';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type ShowtimeStatus, UPCOMING_SHOWTIMES } from '../../_data/mock-dashboard';

const STATUS_TONES: Record<ShowtimeStatus, Tone> = {
  'On sale': 'success',
  'Almost full': 'warning',
  Cancelled: 'muted',
};

// a grid instead of a table: it reflows on phones, so nothing scrolls sideways
const ROW =
  'grid grid-cols-[3.5rem_1fr_auto] items-center gap-x-3 md:grid-cols-[4rem_1fr_7rem_8rem]';

export const UpcomingShowtimes = () => (
  <Card>
    <CardHeader>
      <CardTitle>Upcoming showtimes</CardTitle>
      <CardAction>
        <Link
          href="/showtimes"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          View schedule
        </Link>
      </CardAction>
    </CardHeader>
    <CardContent>
      <div
        className={cn(
          ROW,
          'hidden border-b border-border pb-2 text-sm text-muted-foreground md:grid',
        )}
      >
        <span>Time</span>
        <span>Movie</span>
        <span>Sold</span>
        <span>Status</span>
      </div>
      <ul className="divide-y divide-border">
        {UPCOMING_SHOWTIMES.map((s) => (
          <li key={s.id} className={cn(ROW, 'py-3')}>
            <span className="font-medium tabular-nums">{s.time}</span>
            <div className="min-w-0">
              <div className="truncate">{s.movie}</div>
              <div className="truncate text-sm text-muted-foreground">{s.room}</div>
            </div>
            <span className="hidden text-sm tabular-nums md:block">
              {s.sold} / {s.capacity}
            </span>
            <div className="flex flex-col items-end gap-1 md:items-start">
              <ToneBadge tone={STATUS_TONES[s.status]}>{s.status}</ToneBadge>
              <span className="text-xs text-muted-foreground tabular-nums md:hidden">
                {s.sold} / {s.capacity}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);
