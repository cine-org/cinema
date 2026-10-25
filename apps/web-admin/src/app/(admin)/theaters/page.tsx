import { PageSection } from '@/components/page-section';
import { can, canAny } from '@/lib/access';
import { CURRENT_ACCESS } from '../_data/mock-session';
import { CatalogSummaryCard } from './_components/catalog-summary-card';
import { ClusterCard } from './_components/cluster-card';
import { OverviewStats } from './_components/overview-stats';
import { getCatalogs } from './_data/mock-catalogs';
import { getClusterViews, getOverview } from './_data/mock-clusters';

export const metadata = { title: 'Theaters' };

export default async function TheatersPage() {
  const [overview, clusters, catalogs] = await Promise.all([
    getOverview(),
    getClusterViews(),
    getCatalogs(),
  ]);

  return (
    <div className="space-y-8">
      <OverviewStats data={overview} />

      <PageSection title="Clusters">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {clusters.map((view) => {
            const target = { clusterId: view.cluster.id };
            return (
              <ClusterCard
                key={view.cluster.id}
                view={view}
                canManage={
                  can(CURRENT_ACCESS, 'theaters:update', target) ||
                  can(CURRENT_ACCESS, 'theaters:create', target)
                }
              />
            );
          })}
        </div>
      </PageSection>

      <PageSection title="Catalogs">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {catalogs.map(({ id, title, rows }) => (
            <CatalogSummaryCard
              key={id}
              title={title}
              names={rows.map((r) => r.values.name)}
              href={`/theaters/catalogs#${id}`}
              canManage={canAny(CURRENT_ACCESS, [`${id}:create`, `${id}:update`, `${id}:delete`])}
            />
          ))}
        </div>
      </PageSection>
    </div>
  );
}
