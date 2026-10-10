import { Injectable } from '@nestjs/common';
import { SeatTypeReadRepository } from '../port';
import type { SeatTypeView } from '../views';

export class ListSeatTypesQuery {}

@Injectable()
export class ListSeatTypesHandler {
  constructor(private readonly seatTypes: SeatTypeReadRepository) {}

  async execute(_query: ListSeatTypesQuery): Promise<SeatTypeView[]> {
    return this.seatTypes.list();
  }
}
