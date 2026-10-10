import type { SeatStatus } from '../../domain';

export type SeatView = {
  readonly id: string;
  // Built with Seat.buildCode, not stored.
  readonly seatCode: string;
  readonly seatTypeCode: string;
  readonly x: number;
  readonly y: number;
  readonly rowLabel: string;
  readonly columnNumber: number;
  readonly status: SeatStatus;
};
