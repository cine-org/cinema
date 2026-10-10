import type { RoomLayout, Seat } from '../../domain';

export abstract class RoomLayoutWriteRepository {
  abstract findById(id: string): Promise<RoomLayout | null>;
  abstract findDraft(roomId: string): Promise<RoomLayout | null>; // unique by partial index
  abstract findPublished(roomId: string): Promise<RoomLayout | null>; // unique by partial index
  abstract latestVersion(roomId: string): Promise<number>; // highest version number, for numbering only
  abstract countSeats(layoutId: string): Promise<number>;
  abstract create(layout: RoomLayout, seats: readonly Seat[]): Promise<void>;
  abstract update(layout: RoomLayout, seats?: readonly Seat[]): Promise<void>; // optimistic locking via updatedAt
  abstract updateMany(layouts: readonly RoomLayout[]): Promise<void>; // one transaction
}
