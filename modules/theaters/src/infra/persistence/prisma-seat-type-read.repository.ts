import { Injectable } from '@nestjs/common';
import { DatabaseReadClient, type Prisma } from '@repo/database';
import type { SeatTypeReadRepository, SeatTypeView } from '../../app';

const SEAT_TYPE_VIEW_SELECT = {
  code: true,
  name: true,
  maxOccupancy: true,
  width: true,
} satisfies Prisma.SeatTypeSelect;

@Injectable()
export class PrismaSeatTypeReadRepository implements SeatTypeReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async findByCode(code: string): Promise<SeatTypeView | null> {
    return this.db.seatType.findUnique({ where: { code }, select: SEAT_TYPE_VIEW_SELECT });
  }

  async list(): Promise<SeatTypeView[]> {
    return this.db.seatType.findMany({ select: SEAT_TYPE_VIEW_SELECT, orderBy: { code: 'asc' } });
  }
}
