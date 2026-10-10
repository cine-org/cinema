import { describe, expect, it } from 'vitest';
import {
  buildSeatMap,
  SeatDuplicatePositionException,
  SeatInvalidPlacementException,
  SeatUnknownTypeException,
  type SeatCell,
} from '../../../src/domain';
import { COUPLE, layoutWith, STANDARD } from '../fixtures';

const layout = layoutWith('DRAFT', { gridRows: 5, gridCols: 6 });
const build = (cells: SeatCell[]) => buildSeatMap(layout, cells, [STANDARD, COUPLE]);
const standard = (x: number, y: number): SeatCell => ({ x, y, seatTypeCode: 'STANDARD' });

function thrown(cells: SeatCell[]): unknown {
  try {
    build(cells);
  } catch (error) {
    return error;
  }
  throw new Error('Expected buildSeatMap to throw');
}

describe('buildSeatMap', () => {
  it('numbers seats by row and column, whatever the input order', () => {
    const seats = build([standard(3, 1), standard(0, 0), standard(2, 0), standard(1, 1)]);

    expect(seats.map((seat) => [seat.seatCode, seat.x, seat.y])).toEqual([
      ['A01', 0, 0],
      ['A02', 2, 0],
      ['B01', 1, 1],
      ['B02', 3, 1],
    ]);
    expect(seats.every((seat) => seat.layoutId === layout.id)).toBe(true);
  });

  it('labels only rows that hold seats, so an aisle row skips no letter', () => {
    const seats = build([standard(0, 0), standard(0, 2)]);

    expect(seats.map((seat) => seat.rowLabel)).toEqual(['A', 'B']);
  });

  it('counts a wide seat once in the column numbers', () => {
    const seats = build([{ x: 0, y: 0, seatTypeCode: 'COUPLE' }, standard(2, 0)]);

    expect(seats.map((seat) => seat.seatCode)).toEqual(['A01', 'A02']);
  });

  it('normalizes the seat type code', () => {
    const [seat] = build([{ x: 0, y: 0, seatTypeCode: ' couple ' }]);

    expect(seat?.seatTypeCode).toBe('COUPLE');
  });

  it('returns no seats for an empty map', () => {
    expect(build([])).toEqual([]);
  });

  it('rejects an unknown seat type and points at the seat', () => {
    const error = thrown([standard(0, 0), { x: 1, y: 0, seatTypeCode: 'BED' }]);

    expect(error).toBeInstanceOf(SeatUnknownTypeException);
    expect(error).toMatchObject({ details: [{ field: 'seats.1' }] });
  });

  it('rejects a seat on a taken cell', () => {
    const error = thrown([standard(1, 0), standard(1, 0)]);

    expect(error).toBeInstanceOf(SeatDuplicatePositionException);
    expect(error).toMatchObject({ details: [{ field: 'seats.1' }] });
  });

  it('rejects a seat overlapping the second cell of a wide seat', () => {
    const error = thrown([{ x: 0, y: 0, seatTypeCode: 'COUPLE' }, standard(1, 0)]);

    expect(error).toBeInstanceOf(SeatDuplicatePositionException);
  });

  it.each([
    ['negative x', standard(-1, 0)],
    ['negative y', standard(0, -1)],
    ['row past the grid', standard(0, 5)],
    ['column past the grid', standard(6, 0)],
    ['non-integer position', standard(0.5, 0)],
    ['wide seat crossing the right edge', { x: 5, y: 0, seatTypeCode: 'COUPLE' }],
  ])('rejects a seat outside the grid: %s', (_case, cell) => {
    const error = thrown([cell]);

    expect(error).toBeInstanceOf(SeatInvalidPlacementException);
    expect(error).toMatchObject({ details: [{ field: 'seats.0' }] });
  });

  it('accepts a wide seat ending on the last column', () => {
    expect(build([{ x: 4, y: 0, seatTypeCode: 'COUPLE' }])).toHaveLength(1);
  });
});
