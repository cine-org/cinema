import { Injectable } from '@nestjs/common';
import { DatabaseReadClient, type Prisma } from '@repo/database';
import type {
  RoomLayoutReadRepository,
  RoomLayoutSummaryView,
  RoomLayoutView,
  SeatView,
} from '../../app';
import { Seat } from '../../domain';

const LAYOUT_SELECT = {
  id: true,
  roomId: true,
  version: true,
  status: true,
  gridRows: true,
  gridCols: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.RoomLayoutSelect;

const SUMMARY_SELECT = {
  ...LAYOUT_SELECT,
  _count: { select: { seats: true } },
} satisfies Prisma.RoomLayoutSelect;

// Seats in drawing order: row by row, left to right.
const WITH_SEATS_SELECT = {
  ...LAYOUT_SELECT,
  seats: {
    select: {
      id: true,
      seatTypeCode: true,
      x: true,
      y: true,
      rowLabel: true,
      columnNumber: true,
      status: true,
    },
    orderBy: [{ y: 'asc' }, { x: 'asc' }],
  },
} satisfies Prisma.RoomLayoutSelect;

type SeatRow = Prisma.RoomLayoutGetPayload<{ select: typeof WITH_SEATS_SELECT }>['seats'][number];

@Injectable()
export class PrismaRoomLayoutReadRepository implements RoomLayoutReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async listByRoom(roomId: string): Promise<RoomLayoutSummaryView[]> {
    const rows = await this.db.roomLayout.findMany({
      where: { roomId },
      select: SUMMARY_SELECT,
      orderBy: { version: 'desc' },
    });

    return rows.map(({ _count, ...layout }) => ({ ...layout, seatCount: _count.seats }));
  }

  async findById(roomId: string, layoutId: string): Promise<RoomLayoutView | null> {
    const row = await this.db.roomLayout.findFirst({
      where: { id: layoutId, roomId },
      select: WITH_SEATS_SELECT,
    });

    return row ? { ...row, seats: row.seats.map(toSeatView) } : null;
  }

  async findDraft(roomId: string): Promise<RoomLayoutView | null> {
    const row = await this.db.roomLayout.findFirst({
      where: { roomId, status: 'DRAFT' },
      select: WITH_SEATS_SELECT,
    });

    return row ? { ...row, seats: row.seats.map(toSeatView) } : null;
  }
}

function toSeatView(seat: SeatRow): SeatView {
  return { ...seat, seatCode: Seat.buildCode(seat.rowLabel, seat.columnNumber) };
}
