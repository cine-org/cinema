import { PageSection } from '@/components/page-section';
import { BookingStatusCard } from './_components/dashboard/booking-status';
import { AttentionCard } from './_components/dashboard/attention-card';
import { ExportReportButton } from './_components/dashboard/export-report-button';
import { Heatmap } from './_components/dashboard/heatmap';
import { KpiCards } from './_components/dashboard/kpi-cards';
import { RangeSwitch } from './_components/dashboard/range-switch';
import { TheaterTable } from './_components/dashboard/theater-table';
import { TopMovies } from './_components/dashboard/top-movies';
import { TrendChart } from './_components/dashboard/trend-chart';
import { UpcomingShowtimes } from './_components/dashboard/upcoming-showtimes';
import { RANGE_INFO, getDashboard, parseRange } from './_data/mock-dashboard';

export const metadata = { title: 'Dashboard' };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function DashboardPage({ searchParams }: Props) {
  const range = parseRange((await searchParams).range);
  const data = getDashboard(range);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <RangeSwitch current={range} />
        <ExportReportButton />
      </div>

      <PageSection title="Overview">
        <KpiCards kpis={data.kpis} compare={RANGE_INFO[range].compare} />
      </PageSection>

      <PageSection title="Sales">
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TrendChart key={range} points={data.trend} />
          </div>
          <BookingStatusCard rows={data.bookingStatus} />
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TheaterTable rows={data.theaters} />
          </div>
          <TopMovies rows={data.movies} />
        </div>
      </PageSection>

      <PageSection title="Operations">
        <div className="grid gap-6 xl:grid-cols-3">
          <Heatmap />
          <div className="xl:col-span-2">
            <UpcomingShowtimes />
          </div>
        </div>
        <AttentionCard />
      </PageSection>
    </div>
  );
}
