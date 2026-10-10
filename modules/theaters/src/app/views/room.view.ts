import type { RoomStatus } from '../../domain';

export type RoomView = {
  readonly id: string;
  readonly theaterId: string;
  readonly code: string;
  readonly name: string;
  readonly status: RoomStatus;
  readonly publishedLayoutId: string | null;
  // Counts of the published layout; 0 when there is none.
  readonly seatCount: number;
  readonly capacity: number;
  readonly inactiveSeats: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
};
