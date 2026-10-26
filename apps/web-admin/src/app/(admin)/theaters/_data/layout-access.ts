import { layoutStatus } from './layout-versions';
import type { LayoutStatus, Room } from './types';

type Allowed = (permission: string) => boolean;

// what the signed-in user may do with the layouts of one room
export const layoutRights = (room: Room, allowed: Allowed, closed: boolean) => {
  const canEditDraft = allowed('room-layouts:upsert-draft') && !closed;
  return {
    canEditDraft,
    canCreateDraft: !room.layout.draft && canEditDraft,
    canPublish: allowed('room-layouts:publish'),
    canToggleSeats: (allowed('seats:activate') || allowed('seats:deactivate')) && !closed,
  };
};

type LayoutView =
  // the room has no layout yet
  | { kind: 'empty' }
  // a draft that is not stored yet
  | { kind: 'new' }
  | { kind: 'version'; version: number; status: LayoutStatus; edit: boolean; toggle: boolean };

// what the page shows for ?layout=<raw>; null when that is not something this user may open.
// A draft is edited, a published layout only has seats switched on and off, a retired one is looked at.
export const resolveLayoutView = (
  room: Room,
  raw: string | undefined,
  rights: ReturnType<typeof layoutRights>,
): LayoutView | null => {
  if (raw === 'new') return rights.canCreateDraft ? { kind: 'new' } : null;

  // nothing picked: the published layout, else the draft
  const version = raw === undefined ? (room.layout.published ?? room.layout.draft) : Number(raw);
  if (version === null) return { kind: 'empty' };

  const status = layoutStatus(room, version);
  if (!status) return null;
  return {
    kind: 'version',
    version,
    status,
    edit: status === 'draft' && rights.canEditDraft,
    toggle: status === 'published' && rights.canToggleSeats,
  };
};
