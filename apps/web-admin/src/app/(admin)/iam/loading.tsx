import { TableSkeleton } from '@/components/skeletons';

export default function IAMLoading() {
  return (
    <div role="status" aria-label="Loading">
      <TableSkeleton columns={5} />
    </div>
  );
}
