import { Armchair, DoorOpen, MapPin } from 'lucide-react';
import Link from 'next/link';
import { CreateChildSheet } from '../../../_components/create-child-sheet';
import { CoverImage } from '@/components/cover-image';
import { TheaterStatusBadge } from '../../../_components/theater-status-badge';
import type { Theater } from '../../../_data/types';

const THEATER_FIELDS = [
  { id: 'name', label: 'Theater name' },
  { id: 'slug', label: 'Slug' },
  { id: 'ward', label: 'Ward' },
  { id: 'address', label: 'Address' },
  { id: 'phone', label: 'Phone' },
  { id: 'email', label: 'Email' },
];

const TheaterItem = ({ theater: t }: { theater: Theater }) => (
  <Link
    href={`/theaters/${t.id}`}
    className="group overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/15 transition-shadow hover:shadow-md hover:ring-foreground/25"
  >
    <div className="relative aspect-[16/9] overflow-hidden">
      <CoverImage
        src={t.coverImageUrl}
        alt=""
        sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw"
        className="transition-transform duration-300 group-hover:scale-105"
      />
    </div>
    <div className="grid gap-3 p-4">
      <div className="grid gap-1">
        <div className="flex items-start justify-between gap-2">
          <span className="truncate font-medium">{t.name}</span>
          <TheaterStatusBadge status={t.status} />
        </div>
        <span className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5 shrink-0" />
          <span className="truncate">{[t.address, t.ward].filter(Boolean).join(', ')}</span>
        </span>
      </div>
      <div className="flex gap-4 text-sm tabular-nums text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <DoorOpen className="size-3.5" />
          {t.rooms} {t.rooms === 1 ? 'room' : 'rooms'}
        </span>
        <span className="flex items-center gap-1.5">
          <Armchair className="size-3.5" />
          {t.capacity.toLocaleString('en-US')} seats
        </span>
      </div>
    </div>
  </Link>
);

type Props = { clusterId: string; clusterName: string; theaters: Theater[]; canCreate: boolean };

export const TheatersSection = ({ clusterId, clusterName, theaters, canCreate }: Props) => (
  <section className="space-y-4">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-heading text-base font-medium">Theaters</h2>
        <p className="text-sm text-muted-foreground">
          {theaters.length} {theaters.length === 1 ? 'theater' : 'theaters'} in {clusterName}
        </p>
      </div>
      {canCreate && (
        <CreateChildSheet
          noun="theater"
          parent={{ id: clusterId, name: clusterName }}
          fields={THEATER_FIELDS}
        />
      )}
    </div>
    {theaters.length > 0 ? (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {theaters.map((t) => (
          <TheaterItem key={t.id} theater={t} />
        ))}
      </div>
    ) : (
      <p className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
        No theaters yet.
      </p>
    )}
  </section>
);
