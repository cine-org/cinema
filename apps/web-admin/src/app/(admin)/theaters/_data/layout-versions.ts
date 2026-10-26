import { generateLayout } from './mock-layout';
import type { Layout, LayoutStatus, LayoutVersion, Room } from './types';

// TODO: replace with GET rooms/:roomId/layouts and GET rooms/:roomId/layouts/:layoutId

export const layoutStatus = (room: Room, version: number): LayoutStatus | null => {
  const { published, draft } = room.layout;
  if (version === draft) return 'draft';
  if (version === published) return 'published';
  return published !== null && version >= 1 && version < published ? 'retired' : null;
};

// every version of a mock room looks the same; only the published one has broken seats
export const getLayout = async (room: Room, version: number): Promise<Layout> =>
  generateLayout(
    version === room.layout.published && version !== room.layout.draft ? room.inactiveSeats : 0,
  );

export const getLayoutVersions = async (room: Room): Promise<LayoutVersion[]> => {
  const { published, draft } = room.layout;
  const versions = [
    ...(draft ? [draft] : []),
    ...Array.from({ length: published ?? 0 }, (_, i) => (published ?? 0) - i),
  ];
  return versions.map((version) => ({
    version,
    status: layoutStatus(room, version)!,
    publishedAt: version === draft ? null : `2026-0${version + 3}-1${version}T09:00:00Z`,
  }));
};
