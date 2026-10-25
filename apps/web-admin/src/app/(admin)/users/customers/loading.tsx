import { TableSkeleton } from '@/components/skeletons';

export default function CustomersLoading() {
  return (
    <div role="status" aria-label="Loading">
      <TableSkeleton columns={6} />
    </div>
  );
}
