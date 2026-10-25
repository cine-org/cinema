import { notFound } from 'next/navigation';
import { BackLink } from '@/components/back-link';
import { CoverDialog } from '../_components/cover-dialog';
import { EntityInfoCard } from '../_components/entity-info-card';
import { DangerZone, StatusButton } from '../_components/lifecycle';
import { CoverImage } from '@/components/cover-image';
import { TheaterStatusBadge } from '../_components/theater-status-badge';
import { getClusterView } from '../_data/mock-clusters';
import { getRooms, getTheater } from '../_data/mock-theaters';
import { accessFor } from '../_data/theater-access';
import { RoomsCard } from './_components/rooms-card';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const theater = await getTheater((await params).id);
  return { title: theater?.name ?? 'Theater' };
}

export default async function TheaterPage({ params }: Props) {
  const theater = await getTheater((await params).id);
  if (!theater) notFound();

  const allowed = accessFor(theater);
  const readOnly = theater.status === 'closed';
  const [clusterView, rooms] = await Promise.all([
    getClusterView(theater.clusterId),
    getRooms(theater.id),
  ]);
  const canEdit = allowed('theaters:update') && !readOnly;
  const entity = { kind: 'theater', id: theater.id } as const;
  const allowedActions = {
    activate: allowed('theaters:activate'),
    deactivate: allowed('theaters:deactivate'),
    close: allowed('theaters:close'),
    delete: allowed('theaters:delete') && theater.rooms === 0,
  };
  const fields = [
    { id: 'name', label: 'Theater name', value: theater.name },
    {
      id: 'slug',
      label: 'Slug',
      value: theater.slug,
      locked: theater.status === 'draft' ? undefined : 'Only a draft can change its slug.',
    },
    { id: 'ward', label: 'Ward', value: theater.ward },
    { id: 'address', label: 'Address', value: theater.address },
    { id: 'phone', label: 'Phone', value: theater.phone },
    { id: 'email', label: 'Email', value: theater.email },
  ];

  return (
    <div className="space-y-6">
      <BackLink href="/theaters">Back to theaters</BackLink>

      <div className="relative isolate flex aspect-video max-h-[420px] w-full flex-col justify-between overflow-hidden rounded-xl p-4 sm:p-6">
        <CoverImage
          src={theater.coverImageUrl}
          alt=""
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="-z-10"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/25 to-black/10" />
        <div className="flex justify-end">
          {canEdit && (
            <CoverDialog
              theaterId={theater.id}
              theaterName={theater.name}
              current={theater.coverImageUrl}
            />
          )}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1.5 text-white">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold sm:text-3xl">{theater.name}</h1>
              <TheaterStatusBadge status={theater.status} />
            </div>
            <p className="text-sm text-white/80">
              {[theater.address, theater.ward, clusterView?.cluster.name]
                .filter(Boolean)
                .join(', ')}
            </p>
          </div>
          <StatusButton entity={entity} status={theater.status} allowed={allowedActions} />
        </div>
      </div>

      <EntityInfoCard
        entity={entity}
        title="Theater info"
        canEdit={canEdit}
        fields={fields}
        facts={[
          { label: 'Cluster', value: clusterView?.cluster.name ?? '' },
          { label: 'Rooms', value: String(theater.rooms) },
          { label: 'Capacity', value: `${theater.capacity.toLocaleString('en-US')} seats` },
        ]}
      />
      <RoomsCard
        theaterId={theater.id}
        theaterName={theater.name}
        rooms={rooms}
        canCreate={allowed('rooms:create') && !readOnly}
      />
      <DangerZone entity={entity} status={theater.status} allowed={allowedActions} />
    </div>
  );
}
