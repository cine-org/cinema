import type { Seat } from '../../domain';

// Seats are read through their layout, so there is no read repository.
export abstract class SeatWriteRepository {
  abstract findById(id: string): Promise<Seat | null>;
  abstract update(seat: Seat): Promise<void>;
}
