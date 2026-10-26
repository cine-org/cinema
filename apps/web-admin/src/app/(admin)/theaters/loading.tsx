import { StatCardsSkeleton, TableSkeleton } from '@/components/skeletons';

export default function TheatersLoading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <StatCardsSkeleton />
      <TableSkeleton columns={3} />
    </div>
  );
}
