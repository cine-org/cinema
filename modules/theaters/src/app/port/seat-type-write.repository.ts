import type { SeatType } from '../../domain';

export abstract class SeatTypeWriteRepository {
  abstract findByCode(code: string): Promise<SeatType | null>;
  // Unknown codes are simply missing from the result.
  abstract findByCodes(codes: readonly string[]): Promise<SeatType[]>;
  // True when any seat, in any layout version, uses the type.
  abstract isInUse(code: string): Promise<boolean>;
  abstract create(seatType: SeatType): Promise<void>;
  abstract update(seatType: SeatType): Promise<void>;
  abstract delete(code: string): Promise<void>;
}
