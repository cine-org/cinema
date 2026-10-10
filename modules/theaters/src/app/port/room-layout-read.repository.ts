import type { RoomLayoutSummaryView, RoomLayoutView } from '../views';

export abstract class RoomLayoutReadRepository {
  abstract listByRoom(roomId: string): Promise<RoomLayoutSummaryView[]>; // newest first
  abstract findById(roomId: string, layoutId: string): Promise<RoomLayoutView | null>; // scoped to the room
  abstract findDraft(roomId: string): Promise<RoomLayoutView | null>; // unique by partial index
}
