import { Card, CardContent } from '@/components/ui/card';
import type { Overview } from '../_data/types';

export const OverviewStats = ({ data }: { data: Overview }) => {
  const stats = [
    { label: 'Clusters', value: data.clusters },
    { label: 'Theaters', value: data.theaters },
    { label: 'Rooms', value: data.rooms },
    { label: 'Total capacity', value: data.capacity.toLocaleString('en-US') },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="space-y-1">
            <div className="text-sm text-muted-foreground">{label}</div>
            <div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
