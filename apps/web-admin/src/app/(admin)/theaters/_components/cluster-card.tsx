import { LinkCard } from '@/components/link-card';
import type { ClusterView } from '../_data/types';

type Props = { view: ClusterView; canManage: boolean };

export const ClusterCard = ({ view, canManage }: Props) => {
  const { cluster, theaters, rooms, capacity } = view;
  const stats = [
    { label: 'Theaters', value: theaters.length },
    { label: 'Rooms', value: rooms },
    { label: 'Capacity', value: capacity.toLocaleString('en-US') },
  ];

  // only someone who can edit the cluster has a page to go to
  return (
    <LinkCard title={cluster.name} href={canManage ? `/theaters/clusters/${cluster.id}` : null}>
      <dl className="grid grid-cols-3 gap-3">
        {stats.map(({ label, value }) => (
          <div key={label}>
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="text-xl font-semibold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </LinkCard>
  );
};
