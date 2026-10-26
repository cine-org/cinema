import type { Layout, Seat, SeatType } from './types';

// mirrors the grid limits of the api (room-layout.entity.ts in modules/theaters); keep them in step
export const GRID_LIMIT = { rows: { min: 3, max: 30 }, cols: { min: 4, max: 50 } };

export type Range = { min: number; max: number };

export const clamp = (value: number, { min, max }: Range) =>
  Math.min(Math.max(Math.round(value) || min, min), max);

const find = (types: SeatType[], code: string) => types.find((t) => t.code === code);

// every seat counts toward capacity, broken ones included
export const capacityOf = (seats: Seat[], types: SeatType[]) =>
  seats.reduce((n, s) => n + (find(types, s.type)?.maxOccupancy ?? 1), 0);

// the layout as the admin api stores it
type LayoutJson = {
  gridRows: number;
  gridCols: number;
  seats: { x: number; y: number; seatTypeCode: string }[];
};

export const layoutJson = (layout: Layout) =>
  JSON.stringify({
    gridRows: layout.rows,
    gridCols: layout.cols,
    // sorted, so the same layout drawn in another order compares equal
    seats: [...layout.seats]
      .sort((a, b) => a.y - b.y || a.x - b.x)
      .map(({ x, y, type }) => ({ x, y, seatTypeCode: type })),
  } satisfies LayoutJson);

// throws when the text is not a layout these seat types can draw
export const parseLayout = (text: string, types: SeatType[]): Layout => {
  const data = JSON.parse(text) as LayoutJson;
  const rows = clamp(data.gridRows, GRID_LIMIT.rows);
  const cols = clamp(data.gridCols, GRID_LIMIT.cols);
  const seats = data.seats.map(({ x, y, seatTypeCode }) => {
    const type = find(types, seatTypeCode);
    if (!type || y >= rows || x + type.width > cols) throw new Error('seat out of range');
    return { x, y, type: type.code, active: true };
  });
  return { rows, cols, seats };
};
