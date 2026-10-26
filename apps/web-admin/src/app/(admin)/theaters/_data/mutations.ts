import { notWired } from '@/lib/result';
import type { Layout } from './types';

// every change the theaters screens make goes through here, one function per admin api call.
// TODO: call the admin api; until then each one reports that it is not wired.

export type InfoEntity = { kind: 'cluster' | 'theater' | 'room'; id: string };
export type LifecycleEntity = { kind: 'theater' | 'room'; id: string };
export type LifecycleAction = 'activate' | 'deactivate' | 'close' | 'delete';

// PATCH theaters/:id and rooms/:id; clusters are not stored by the api yet
export const saveInfo = async (entity: InfoEntity, values: Record<string, string>) =>
  notWired(`saving ${entity.kind} ${entity.id} (${Object.keys(values).join(', ')})`);

// PUT theaters/:id/cover-image as multipart, DELETE when file is null; file storage is not decided yet
export const saveCoverImage = async (theaterId: string, file: File | null) =>
  notWired(
    file
      ? `uploading ${file.name} as the cover of ${theaterId}`
      : `removing the cover of ${theaterId}`,
  );

// POST theaters/:id/(activate|deactivate|close) and rooms/:id/..., DELETE for a draft
export const runLifecycle = async (entity: LifecycleEntity, action: LifecycleAction) =>
  notWired(`${action} on ${entity.kind} ${entity.id}`);

// POST clusters/:id/theaters and theaters/:id/rooms; both start as a draft
export const createChild = async (
  kind: 'theater' | 'room',
  parentId: string,
  values: Record<string, string>,
) => notWired(`creating a ${kind} in ${parentId} (${Object.keys(values).join(', ')})`);

// PUT rooms/:roomId/layouts/draft
export const saveDraftLayout = async (roomId: string, layout: Layout) =>
  notWired(`saving the draft of room ${roomId} (${layout.seats.length} seats)`);

// POST rooms/:roomId/layouts/draft/publish
export const publishDraft = async (roomId: string) => notWired(`publishing room ${roomId}`);

// one activate or deactivate call per changed seat
type SeatChange = { x: number; y: number; active: boolean };
export const saveSeatChanges = async (roomId: string, version: number, changes: SeatChange[]) =>
  notWired(`updating ${changes.length} seats of room ${roomId} v${version}`);

// POST|PATCH|DELETE on the catalog endpoints; a null code is a new item
export const saveCatalogItem = async (
  catalog: string,
  code: string | null,
  values: Record<string, string>,
) => notWired(`saving ${catalog} ${code ?? 'new'} (${Object.keys(values).join(', ')})`);

export const deleteCatalogItem = async (catalog: string, code: string) =>
  notWired(`deleting ${catalog} ${code}`);
