import { omitUndefined } from '@repo/common';
import { SeatTypeInvalidException, SeatTypeInUseException } from '../exceptions';

export const SEAT_TYPE_CODE_PATTERN = /^[A-Z0-9_]{1,20}$/;
// Upper bounds catch typos; real seats span at most 2–3 cells.
export const MAX_SEAT_WIDTH = 4;
export const MAX_SEAT_OCCUPANCY = 4;

export type SeatTypeProps = {
  readonly code: string; // STANDARD, COUPLE, etc.
  name: string;
  maxOccupancy: number;
  width: number; // Grid cells the seat spans in a layout.
};

export type SeatTypeDetails = Omit<SeatTypeProps, 'code'>;

export class SeatType {
  private constructor(private readonly props: SeatTypeProps) {}

  static create(code: string, details: SeatTypeDetails): SeatType {
    return new SeatType({ code: SeatType.normalizeCode(code), ...SeatType.normalize(details) });
  }

  static restore(props: SeatTypeProps): SeatType {
    return new SeatType({ ...props });
  }

  static normalizeCode(code: string): string {
    const normalized = code.trim().toUpperCase();

    if (!SEAT_TYPE_CODE_PATTERN.test(normalized)) {
      throw new SeatTypeInvalidException();
    }

    return normalized;
  }

  // Shape is locked while in use: layouts would overlap, capacity history would shift.
  update(details: Partial<SeatTypeDetails>, inUse: boolean): void {
    const next = SeatType.normalize({ ...this.toDetails(), ...omitUndefined(details) });
    const shapeChanged =
      next.width !== this.props.width || next.maxOccupancy !== this.props.maxOccupancy;

    if (inUse && shapeChanged) {
      throw new SeatTypeInUseException();
    }

    Object.assign(this.props, next);
  }

  assertDeletable(inUse: boolean): void {
    if (inUse) {
      throw new SeatTypeInUseException();
    }
  }

  private static normalize(details: SeatTypeDetails): SeatTypeDetails {
    // Copied field by field so stray keys never reach props.
    const normalized = {
      name: details.name.trim(),
      maxOccupancy: details.maxOccupancy,
      width: details.width,
    };

    const valid =
      normalized.name !== '' &&
      Number.isInteger(normalized.maxOccupancy) &&
      normalized.maxOccupancy >= 1 &&
      normalized.maxOccupancy <= MAX_SEAT_OCCUPANCY &&
      Number.isInteger(normalized.width) &&
      normalized.width >= 1 &&
      normalized.width <= MAX_SEAT_WIDTH;

    if (!valid) {
      throw new SeatTypeInvalidException();
    }

    return normalized;
  }

  private toDetails(): SeatTypeDetails {
    const { code: _code, ...details } = this.props;
    return details;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  get maxOccupancy(): number {
    return this.props.maxOccupancy;
  }

  get width(): number {
    return this.props.width;
  }
}
