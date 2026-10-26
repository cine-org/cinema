import { StatCardsSkeleton, TableSkeleton } from '@/components/skeletons';

// shown while any page in this group streams in; the shell around it stays on screen
export default function AdminLoading() {
  return (
    <div role="status" aria-label="Loading" className="space-y-6">
      <StatCardsSkeleton />
      <TableSkeleton />
    </div>
  );
}
