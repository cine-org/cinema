import { omitUndefined } from '@repo/common';
import { SeatInvalidPlacementException } from '../exceptions';

export const SEAT_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;

export type SeatStatus = (typeof SEAT_STATUS)[keyof typeof SEAT_STATUS];

// I and O are skipped: they read like 1 and 0.
const ROW_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const ROW_LABEL_PATTERN = /^[A-HJ-NP-Z]+$/;
const SEAT_CODE_PATTERN = /^([A-HJ-NP-Z]+)(\d{2,})$/;

export type SeatProps = {
  readonly id: string;
  readonly layoutId: string;
  seatTypeCode: string;
  // Grid cell of the left edge.
  x: number;
  y: number;
  // Derived from the position.
  rowLabel: string;
  columnNumber: number;
  status: SeatStatus;
};

export type SeatDetails = Omit<SeatProps, 'id' | 'layoutId' | 'status'>;

export class Seat {
  private constructor(private readonly props: SeatProps) {}

  // Only created in a draft layout, checked by the caller.
  static create(layoutId: string, details: SeatDetails): Seat {
    return new Seat({
      id: crypto.randomUUID(),
      layoutId,
      ...Seat.normalize(details),
      status: SEAT_STATUS.ACTIVE,
    });
  }

  static restore(props: SeatProps): Seat {
    return new Seat({ ...props });
  }

  // 0 → A, 23 → Z, 24 → AA, like spreadsheet columns.
  static rowLabelAt(index: number): string {
    let label = '';

    for (let n = index + 1; n > 0; n = Math.floor((n - 1) / ROW_LETTERS.length)) {
      label = ROW_LETTERS[(n - 1) % ROW_LETTERS.length] + label;
    }

    return label;
  }

  static buildCode(rowLabel: string, columnNumber: number): string {
    return `${rowLabel}${String(columnNumber).padStart(2, '0')}`;
  }

  static parseCode(code: string): Pick<SeatProps, 'rowLabel' | 'columnNumber'> | null {
    const match = SEAT_CODE_PATTERN.exec(code.trim().toUpperCase());

    if (!match) {
      return null;
    }

    const [, rowLabel = '', column = ''] = match;
    return { rowLabel, columnNumber: Number(column) };
  }

  update(details: Partial<SeatDetails>): void {
    Object.assign(this.props, Seat.normalize({ ...this.toDetails(), ...omitUndefined(details) }));
  }

  // Only seats of a published layout; the caller checks the layout.
  activate(): void {
    this.props.status = SEAT_STATUS.ACTIVE;
  }

  deactivate(): void {
    this.props.status = SEAT_STATUS.INACTIVE;
  }

  private static normalize(details: SeatDetails): SeatDetails {
    // Copied field by field so stray keys never reach props.
    const normalized = {
      seatTypeCode: details.seatTypeCode.trim().toUpperCase(),
      x: details.x,
      y: details.y,
      rowLabel: details.rowLabel,
      columnNumber: details.columnNumber,
    };
    const { seatTypeCode, x, y, rowLabel, columnNumber } = normalized;

    const valid =
      seatTypeCode !== '' &&
      Number.isInteger(x) &&
      Number.isInteger(y) &&
      x >= 0 &&
      y >= 0 &&
      ROW_LABEL_PATTERN.test(rowLabel) &&
      Number.isInteger(columnNumber) &&
      columnNumber >= 1;

    if (!valid) {
      throw new SeatInvalidPlacementException();
    }

    return normalized;
  }

  private toDetails(): SeatDetails {
    const { id: _id, layoutId: _layoutId, status: _status, ...details } = this.props;
    return details;
  }

  get id(): string {
    return this.props.id;
  }

  get layoutId(): string {
    return this.props.layoutId;
  }

  get seatCode(): string {
    return Seat.buildCode(this.props.rowLabel, this.props.columnNumber);
  }

  get seatTypeCode(): string {
    return this.props.seatTypeCode;
  }

  get x(): number {
    return this.props.x;
  }

  get y(): number {
    return this.props.y;
  }

  get rowLabel(): string {
    return this.props.rowLabel;
  }

  get columnNumber(): number {
    return this.props.columnNumber;
  }

  get status(): SeatStatus {
    return this.props.status;
  }
}
