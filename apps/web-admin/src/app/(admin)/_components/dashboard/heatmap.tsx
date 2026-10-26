import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HEATMAP, HEATMAP_DAYS, HEATMAP_HOURS } from '../../_data/mock-dashboard';

export const Heatmap = () => (
  <Card>
    <CardHeader>
      <CardTitle>Busiest hours</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div
        className="grid grid-cols-[2.5rem_repeat(7,1fr)] gap-1 sm:gap-1.5"
        role="table"
        aria-label="Average occupancy by weekday and hour"
      >
        <span />
        {HEATMAP_HOURS.map((h) => (
          <span key={h} className="text-center text-xs text-muted-foreground">
            {h}
          </span>
        ))}
        {HEATMAP.map((row, d) => (
          <div key={HEATMAP_DAYS[d]} className="contents" role="row">
            <span className="flex items-center text-xs text-muted-foreground">
              {HEATMAP_DAYS[d]}
            </span>
            {row.map((value, h) => (
              <div
                key={h}
                role="cell"
                title={`${HEATMAP_DAYS[d]} ${HEATMAP_HOURS[h]}: ${value}%`}
                aria-label={`${HEATMAP_DAYS[d]} ${HEATMAP_HOURS[h]}: ${value}%`}
                className="h-8 rounded-md bg-primary sm:h-9"
                style={{ opacity: 0.08 + (value / 100) * 0.92 }}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        Low
        {[0.08, 0.3, 0.55, 0.8, 1].map((o) => (
          <span
            key={o}
            className="size-3 rounded-sm bg-primary"
            style={{ opacity: o }}
            aria-hidden
          />
        ))}
        High
      </div>
    </CardContent>
  </Card>
);
