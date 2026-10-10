import { Injectable } from '@nestjs/common';
import { ConflictException } from '@repo/common';
import {
  DatabaseWriteClient,
  PRISMA_ERROR_CODE,
  throwIfPrismaError,
  type Prisma,
} from '@repo/database';
import type { RoomLayoutWriteRepository } from '../../app';
import { RoomLayout, type Seat } from '../../domain';

@Injectable()
export class PrismaRoomLayoutWriteRepository implements RoomLayoutWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findById(id: string): Promise<RoomLayout | null> {
    const row = await this.db.roomLayout.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findDraft(roomId: string): Promise<RoomLayout | null> {
    const row = await this.db.roomLayout.findFirst({ where: { roomId, status: 'DRAFT' } });
    return row ? toEntity(row) : null;
  }

  async findPublished(roomId: string): Promise<RoomLayout | null> {
    const row = await this.db.roomLayout.findFirst({ where: { roomId, status: 'PUBLISHED' } });
    return row ? toEntity(row) : null;
  }

  async latestVersion(roomId: string): Promise<number> {
    const { _max } = await this.db.roomLayout.aggregate({
      where: { roomId },
      _max: { version: true },
    });

    return _max.version ?? 0;
  }

  async countSeats(layoutId: string): Promise<number> {
    return this.db.seat.count({ where: { layoutId } });
  }

  async create(layout: RoomLayout, seats: readonly Seat[]): Promise<void> {
    try {
      await this.db.$transaction([
        this.db.roomLayout.create({ data: toCreateData(layout) }),
        this.db.seat.createMany({ data: seats.map(toSeatData) }),
      ]);
    } catch (error) {
      // Same version or a second draft for the room: another request got there first.
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED]: () =>
          new ConflictException({
            message: 'Room layout changed; reload and try again',
            cause: error,
          }),
        [PRISMA_ERROR_CODE.FOREIGN_KEY_CONSTRAINT_FAILED]: () =>
          new ConflictException({ message: 'Room or seat type no longer exists', cause: error }),
      });

      throw error;
    }
  }

  async update(layout: RoomLayout, seats?: readonly Seat[]): Promise<void> {
    await this.db.$transaction(async (tx) => {
      await this.updateRow(tx, layout);

      if (seats) {
        await tx.seat.deleteMany({ where: { layoutId: layout.id } });
        await tx.seat.createMany({ data: seats.map(toSeatData) });
      }
    });
  }

  async updateMany(layouts: readonly RoomLayout[]): Promise<void> {
    await this.db.$transaction(async (tx) => {
      for (const layout of layouts) {
        await this.updateRow(tx, layout);
      }
    });
  }

  // Optimistic lock: matches only if nobody wrote the row since it was loaded.
  private async updateRow(tx: Prisma.TransactionClient, layout: RoomLayout): Promise<void> {
    if (!layout.updatedAt) {
      throw new Error('Cannot update a layout that was never saved');
    }

    const { count } = await tx.roomLayout.updateMany({
      where: { id: layout.id, updatedAt: layout.updatedAt },
      data: {
        gridRows: layout.gridRows,
        gridCols: layout.gridCols,
        status: layout.status,
        publishedAt: layout.publishedAt,
      },
    });

    if (count === 0) {
      throw new ConflictException({ message: 'Room layout changed; reload and try again' });
    }
  }
}

function toEntity(row: Prisma.RoomLayoutModel): RoomLayout {
  return RoomLayout.restore({
    id: row.id,
    roomId: row.roomId,
    version: row.version,
    gridRows: row.gridRows,
    gridCols: row.gridCols,
    status: row.status,
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  });
}

function toCreateData(layout: RoomLayout): Prisma.RoomLayoutUncheckedCreateInput {
  return {
    id: layout.id,
    roomId: layout.roomId,
    version: layout.version,
    gridRows: layout.gridRows,
    gridCols: layout.gridCols,
    status: layout.status,
    publishedAt: layout.publishedAt,
  };
}

function toSeatData(seat: Seat): Prisma.SeatCreateManyInput {
  return {
    id: seat.id,
    layoutId: seat.layoutId,
    seatTypeCode: seat.seatTypeCode,
    rowLabel: seat.rowLabel,
    columnNumber: seat.columnNumber,
    x: seat.x,
    y: seat.y,
    status: seat.status,
  };
}
