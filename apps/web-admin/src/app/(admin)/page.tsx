import { ApiHealthButton } from './_components/api-health-button';

export const metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <ApiHealthButton />
    </div>
  );
}
