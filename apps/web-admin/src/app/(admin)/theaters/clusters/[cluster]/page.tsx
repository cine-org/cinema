import { notFound } from 'next/navigation';
import { can } from '@/lib/access';
import { CURRENT_ACCESS } from '../../../_data/mock-session';
import { PageHeader } from '@/components/page-header';
import { EntityInfoCard } from '../../_components/entity-info-card';
import { getClusterView } from '../../_data/mock-clusters';
import { TheatersSection } from './_components/theaters-section';

type Props = { params: Promise<{ cluster: string }> };

export async function generateMetadata({ params }: Props) {
  return { title: (await getClusterView((await params).cluster))?.cluster.name ?? 'Cluster' };
}

export default async function ClusterPage({ params }: Props) {
  const view = await getClusterView((await params).cluster);
  if (!view) notFound();

  const { cluster, theaters } = view;
  const target = { clusterId: cluster.id };
  const canUpdate = can(CURRENT_ACCESS, 'theaters:update', target);
  const canCreate = can(CURRENT_ACCESS, 'theaters:create', target);
  // this page is for editing, so someone who cannot edit the cluster has nothing to do here
  if (!canUpdate && !canCreate) notFound();

  return (
    <div className="space-y-6">
      <PageHeader back={{ href: '/theaters', label: 'Back to theaters' }} title={cluster.name} />

      <EntityInfoCard
        entity={{ kind: 'cluster', id: cluster.id }}
        title="Cluster info"
        columns={4}
        canEdit={canUpdate}
        fields={[{ id: 'name', label: 'Cluster name', value: cluster.name }]}
        facts={[
          { label: 'Theaters', value: `${theaters.length} (${view.byStatus.active} active)` },
          { label: 'Rooms', value: String(view.rooms) },
          { label: 'Capacity', value: `${view.capacity.toLocaleString('en-US')} seats` },
        ]}
      />
      <TheatersSection
        clusterId={cluster.id}
        clusterName={cluster.name}
        theaters={theaters}
        canCreate={canCreate}
      />
    </div>
  );
}
