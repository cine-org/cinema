import { TableSkeleton } from '@/components/skeletons';

export default function EmployeesLoading() {
  return (
    <div role="status" aria-label="Loading">
      <TableSkeleton columns={7} />
    </div>
  );
}
