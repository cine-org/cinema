import { Injectable } from '@nestjs/common';
import {
  DatabaseWriteClient,
  PRISMA_ERROR_CODE,
  throwIfPrismaError,
  type Prisma,
} from '@repo/database';
import type { SeatWriteRepository } from '../../app';
import { Seat, SeatNotFoundException } from '../../domain';

@Injectable()
export class PrismaSeatWriteRepository implements SeatWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findById(id: string): Promise<Seat | null> {
    const row = await this.db.seat.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  // Only the status changes here; drafts replace seats through the layout.
  async update(seat: Seat): Promise<void> {
    try {
      await this.db.seat.update({ where: { id: seat.id }, data: { status: seat.status } });
    } catch (error) {
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.RECORD_REQUIRED_BUT_NOT_FOUND]: () =>
          new SeatNotFoundException({ cause: error }),
      });

      throw error;
    }
  }
}

function toEntity(row: Prisma.SeatModel): Seat {
  return Seat.restore({
    id: row.id,
    layoutId: row.layoutId,
    seatTypeCode: row.seatTypeCode,
    x: row.x,
    y: row.y,
    rowLabel: row.rowLabel,
    columnNumber: row.columnNumber,
    status: row.status,
  });
}
