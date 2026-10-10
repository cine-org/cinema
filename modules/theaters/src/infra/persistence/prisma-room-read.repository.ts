import { Injectable } from '@nestjs/common';
import { DatabaseReadClient, Prisma } from '@repo/database';
import type { RoomReadRepository, RoomView } from '../../app';
import type { RoomStatus } from '../../domain';

const ROOM_SELECT = {
  id: true,
  theaterId: true,
  code: true,
  name: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  layouts: { where: { status: 'PUBLISHED' }, select: { id: true } },
} satisfies Prisma.RoomSelect;

type RoomRow = Prisma.RoomGetPayload<{ select: typeof ROOM_SELECT }>;

type LayoutStats = {
  readonly layoutId: string;
  readonly seatCount: number;
  readonly capacity: number;
  readonly inactiveSeats: number;
};

@Injectable()
export class PrismaRoomReadRepository implements RoomReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async findById(id: string): Promise<RoomView | null> {
    const row = await this.db.room.findUnique({ where: { id }, select: ROOM_SELECT });
    return row ? ((await this.toViews([row]))[0] ?? null) : null;
  }

  async listByTheater(theaterId: string, status?: RoomStatus): Promise<RoomView[]> {
    const rows = await this.db.room.findMany({
      where: { theaterId, status },
      select: ROOM_SELECT,
      orderBy: { code: 'asc' },
    });

    return this.toViews(rows);
  }

  private async toViews(rows: RoomRow[]): Promise<RoomView[]> {
    const layoutIds = rows.flatMap((row) => row.layouts.map((layout) => layout.id));
    const statsByLayout = new Map(
      (await this.layoutStats(layoutIds)).map((stats) => [stats.layoutId, stats]),
    );

    return rows.map(({ layouts, ...room }) => {
      const publishedLayoutId = layouts[0]?.id ?? null;
      const stats = publishedLayoutId ? statsByLayout.get(publishedLayoutId) : undefined;

      return {
        ...room,
        publishedLayoutId,
        seatCount: stats?.seatCount ?? 0,
        capacity: stats?.capacity ?? 0,
        inactiveSeats: stats?.inactiveSeats ?? 0,
      };
    });
  }

  // One aggregate query instead of loading every seat of every room.
  private async layoutStats(layoutIds: string[]): Promise<LayoutStats[]> {
    if (layoutIds.length === 0) {
      return [];
    }

    return this.db.$queryRaw<LayoutStats[]>`
      SELECT s.layout_id                                      AS "layoutId",
             COUNT(*)::int                                    AS "seatCount",
             SUM(st.max_occupancy)::int                       AS "capacity",
             COUNT(*) FILTER (WHERE s.status = 'INACTIVE')::int AS "inactiveSeats"
      FROM seats s
      JOIN seat_types st ON st.code = s.seat_type_code
      WHERE s.layout_id IN (${Prisma.join(layoutIds)})
      GROUP BY s.layout_id
    `;
  }
}
