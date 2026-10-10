import type { SeatTypeView } from '../views';

// Views for queries only; commands go through the write repository.
export abstract class SeatTypeReadRepository {
  abstract findByCode(code: string): Promise<SeatTypeView | null>;
  abstract list(): Promise<SeatTypeView[]>;
}
