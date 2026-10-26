import { Plus } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';
import { EntityInfoCard } from '../../../_components/entity-info-card';
import { DangerZone, StatusButton } from '../../../_components/lifecycle';
import { SeatTypesProvider } from '../../../_components/seat-types';
import { TheaterStatusBadge } from '../../../_components/theater-status-badge';
import { layoutRights, resolveLayoutView } from '../../../_data/layout-access';
import { getLayout, getLayoutVersions } from '../../../_data/layout-versions';
import { getSeatTypes } from '../../../_data/mock-catalogs';
import { getRoom, getTheater } from '../../../_data/mock-theaters';
import { accessFor } from '../../../_data/theater-access';
import { LayoutEditor } from './_components/layout-editor';
import { LayoutViewer } from './_components/layout-viewer';
import { VersionPicker } from './_components/version-picker';

type Props = {
  params: Promise<{ id: string; roomId: string }>;
  // ?layout=<version> picks the version shown, ?layout=new opens an empty draft
  searchParams: Promise<{ layout?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id, roomId } = await params;
  return { title: (await getRoom(id, roomId))?.name ?? 'Room' };
}

export default async function RoomPage({ params, searchParams }: Props) {
  const { id, roomId } = await params;
  const { layout: raw } = await searchParams;
  const [theater, room] = await Promise.all([getTheater(id), getRoom(id, roomId)]);
  if (!theater || !room) notFound();

  const allowed = accessFor(theater);
  const closed = room.status === 'closed' || theater.status === 'closed';
  const rights = layoutRights(room, allowed, closed);
  const view = resolveLayoutView(room, raw, rights);
  if (!view) notFound();

  const actions = {
    activate: allowed('rooms:activate'),
    deactivate: allowed('rooms:deactivate'),
    close: allowed('rooms:close'),
    delete: allowed('rooms:delete'),
  };
  const entity = { kind: 'room', id: room.id } as const;
  const baseHref = `/theaters/${theater.id}/rooms/${room.id}`;

  const info = (
    <EntityInfoCard
      layout="stack"
      entity={entity}
      title="Room info"
      canEdit={allowed('rooms:update') && !closed}
      fields={[
        {
          id: 'code',
          label: 'Code',
          value: room.code,
          locked: room.status === 'draft' ? undefined : 'Only a draft can change its code.',
        },
        { id: 'name', label: 'Name', value: room.name },
      ]}
    />
  );

  const [seatTypes, versions, layout] = await Promise.all([
    getSeatTypes(),
    getLayoutVersions(room),
    view.kind === 'version'
      ? getLayout(room, view.version)
      : view.kind === 'new'
        ? { rows: 0, cols: 0, seats: [] }
        : null,
  ]);

  const picker = (
    <VersionPicker
      versions={versions}
      current={view.kind === 'version' ? view.version : 'new'}
      baseHref={baseHref}
      canCreateDraft={rights.canCreateDraft}
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        back={{ href: `/theaters/${theater.id}`, label: `Back to ${theater.name}` }}
        title={room.name}
        badge={<TheaterStatusBadge status={room.status} />}
        actions={
          <StatusButton
            entity={entity}
            status={room.status}
            allowed={actions}
            blocked={
              room.layout.published ? {} : { activate: 'Publish a layout before activating.' }
            }
          />
        }
      />

      <SeatTypesProvider types={seatTypes}>
        {layout && view.kind === 'new' ? (
          <LayoutEditor
            key="new"
            roomId={room.id}
            info={info}
            picker={picker}
            initial={layout}
            canPublish={rights.canPublish}
            isNew
          />
        ) : layout && view.kind === 'version' && view.edit ? (
          <LayoutEditor
            key={view.version}
            roomId={room.id}
            info={info}
            picker={picker}
            initial={layout}
            canPublish={rights.canPublish}
          />
        ) : layout && view.kind === 'version' ? (
          <LayoutViewer
            key={view.version}
            roomId={room.id}
            version={view.version}
            info={info}
            picker={picker}
            layout={layout}
            canToggleSeats={view.toggle}
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-[18rem_1fr] xl:items-start">
            {info}
            <Card>
              <CardContent className="grid justify-items-center gap-4 py-10">
                <p className="text-sm text-muted-foreground">
                  No layout yet. Draw one and publish it before activating the room.
                </p>
                {rights.canCreateDraft && (
                  <Button asChild size="lg">
                    <Link href={`${baseHref}?layout=new`}>
                      <Plus />
                      New draft
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </SeatTypesProvider>

      <DangerZone entity={entity} status={room.status} allowed={actions} />
    </div>
  );
}
