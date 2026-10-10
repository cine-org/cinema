import { Seat, type RoomLayout, type SeatType } from '../entities';
import {
  SeatDuplicatePositionException,
  SeatInvalidPlacementException,
  SeatUnknownTypeException,
} from '../exceptions';

export type SeatCell = {
  readonly x: number;
  readonly y: number;
  readonly seatTypeCode: string;
};

// Rules across the whole seat set; single-seat rules stay in Seat.
export function buildSeatMap(
  layout: RoomLayout,
  cells: readonly SeatCell[],
  seatTypes: readonly SeatType[],
): Seat[] {
  const typesByCode = new Map(seatTypes.map((seatType) => [seatType.code, seatType]));
  const occupied = new Set<string>();
  const rows = new Map<number, SeatCell[]>();

  cells.forEach((cell, index) => {
    // Points the client at the offending seat, e.g. `seats.12`.
    const field = `seats.${index}`;
    const seatTypeCode = cell.seatTypeCode.trim().toUpperCase();
    const seatType = typesByCode.get(seatTypeCode);

    if (!seatType) {
      throw new SeatUnknownTypeException({
        details: [{ field, message: `Unknown seat type ${seatTypeCode}` }],
      });
    }

    if (!fitsGrid(layout, cell, seatType.width)) {
      throw new SeatInvalidPlacementException({
        details: [{ field, message: 'Seat is outside the grid' }],
      });
    }

    for (let offset = 0; offset < seatType.width; offset++) {
      const key = `${cell.y}:${cell.x + offset}`;

      if (occupied.has(key)) {
        throw new SeatDuplicatePositionException({
          details: [{ field, message: 'Seat overlaps another seat' }],
        });
      }

      occupied.add(key);
    }

    rows.set(cell.y, [...(rows.get(cell.y) ?? []), { ...cell, seatTypeCode }]);
  });

  // Only rows holding seats get a label, so an aisle row never skips a letter.
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .flatMap(([y, rowCells], rowIndex) =>
      [...rowCells]
        .sort((a, b) => a.x - b.x)
        .map((cell, columnIndex) =>
          Seat.create(layout.id, {
            seatTypeCode: cell.seatTypeCode,
            x: cell.x,
            y,
            rowLabel: Seat.rowLabelAt(rowIndex),
            columnNumber: columnIndex + 1,
          }),
        ),
    );
}

function fitsGrid({ gridRows, gridCols }: RoomLayout, { x, y }: SeatCell, width: number): boolean {
  return (
    Number.isInteger(x) &&
    Number.isInteger(y) &&
    x >= 0 &&
    y >= 0 &&
    y < gridRows &&
    x + width <= gridCols
  );
}
