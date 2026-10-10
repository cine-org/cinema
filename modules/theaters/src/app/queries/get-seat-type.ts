import { Injectable } from '@nestjs/common';
import { SeatType, SeatTypeNotFoundException } from '../../domain';
import { SeatTypeReadRepository } from '../port';
import type { SeatTypeView } from '../views';

export class GetSeatTypeQuery {
  constructor(readonly code: string) {}
}

@Injectable()
export class GetSeatTypeHandler {
  constructor(private readonly seatTypes: SeatTypeReadRepository) {}

  async execute(query: GetSeatTypeQuery): Promise<SeatTypeView> {
    const seatType = await this.seatTypes.findByCode(SeatType.normalizeCode(query.code));

    if (!seatType) {
      throw new SeatTypeNotFoundException();
    }

    return seatType;
  }
}
