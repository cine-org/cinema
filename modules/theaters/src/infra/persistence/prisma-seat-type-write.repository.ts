import { Injectable } from '@nestjs/common';
import {
  DatabaseWriteClient,
  PRISMA_ERROR_CODE,
  throwIfPrismaError,
  type Prisma,
} from '@repo/database';
import type { SeatTypeWriteRepository } from '../../app';
import {
  SeatType,
  SeatTypeCodeTakenException,
  SeatTypeInUseException,
  SeatTypeNotFoundException,
} from '../../domain';

@Injectable()
export class PrismaSeatTypeWriteRepository implements SeatTypeWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async findByCode(code: string): Promise<SeatType | null> {
    const row = await this.db.seatType.findUnique({ where: { code } });
    return row ? toEntity(row) : null;
  }

  async findByCodes(codes: readonly string[]): Promise<SeatType[]> {
    const rows = await this.db.seatType.findMany({ where: { code: { in: [...codes] } } });
    return rows.map(toEntity);
  }

  async isInUse(code: string): Promise<boolean> {
    const seat = await this.db.seat.findFirst({
      where: { seatTypeCode: code },
      select: { id: true },
    });

    return seat !== null;
  }

  async create(seatType: SeatType): Promise<void> {
    try {
      await this.db.seatType.create({ data: toPrisma(seatType) });
    } catch (error) {
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED]: () =>
          new SeatTypeCodeTakenException({ cause: error }),
      });

      throw error;
    }
  }

  // Fails instead of re-inserting when the row was deleted in the meantime.
  async update(seatType: SeatType): Promise<void> {
    const { code, ...data } = toPrisma(seatType);

    try {
      await this.db.seatType.update({ where: { code }, data });
    } catch (error) {
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.RECORD_REQUIRED_BUT_NOT_FOUND]: () =>
          new SeatTypeNotFoundException({ cause: error }),
      });

      throw error;
    }
  }

  async delete(code: string): Promise<void> {
    try {
      await this.db.seatType.delete({ where: { code } });
    } catch (error) {
      // A seat saved after the isInUse check still hits the FK.
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.FOREIGN_KEY_CONSTRAINT_FAILED]: () =>
          new SeatTypeInUseException({ cause: error }),
        [PRISMA_ERROR_CODE.RECORD_REQUIRED_BUT_NOT_FOUND]: () =>
          new SeatTypeNotFoundException({ cause: error }),
      });

      throw error;
    }
  }
}

function toEntity(row: Prisma.SeatTypeModel): SeatType {
  return SeatType.restore({
    code: row.code,
    name: row.name,
    maxOccupancy: row.maxOccupancy,
    width: row.width,
  });
}

function toPrisma(seatType: SeatType): Prisma.SeatTypeCreateInput {
  return {
    code: seatType.code,
    name: seatType.name,
    maxOccupancy: seatType.maxOccupancy,
    width: seatType.width,
  };
}
