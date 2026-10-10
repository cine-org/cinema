import type { RoomLayoutStatus } from '../../domain';
import type { SeatView } from './seat.view';

// One version in a room's layout history, without its seats.
export type RoomLayoutSummaryView = {
  readonly id: string;
  readonly roomId: string;
  readonly version: number;
  readonly status: RoomLayoutStatus;
  readonly gridRows: number;
  readonly gridCols: number;
  readonly seatCount: number;
  readonly publishedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};

export type RoomLayoutView = Omit<RoomLayoutSummaryView, 'seatCount'> & {
  readonly seats: SeatView[];
};
