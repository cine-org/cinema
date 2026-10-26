import type { Layout, SeatType } from './types';

// TODO: replace with the layouts endpoints of the admin api

export const MOCK_SEAT_TYPES: SeatType[] = [
  { code: 'STANDARD', name: 'Standard', width: 1, maxOccupancy: 1 },
  { code: 'COUPLE', name: 'Couple', width: 2, maxOccupancy: 2 },
  { code: 'VIP', name: 'VIP', width: 1, maxOccupancy: 1 },
];

// every mock layout is the same 12 rows by 16 columns with the aisle in column 6:
// 11 standard rows (five seats left of the aisle, ten right) and a row of five couples at the back
const COLS = 16;
const AISLE_X = 5;
const STANDARD_ROWS = 11;
const SEAT_X = Array.from({ length: COLS }, (_, x) => x).filter((x) => x !== AISLE_X);
// one empty cell between couples on the left of the aisle and two on the right
const COUPLE_X = [0, 3, 6, 10, 14];

export const MOCK_CAPACITY = STANDARD_ROWS * SEAT_X.length + COUPLE_X.length * 2;

// a stand-in for the stored layout; the broken seats are spread through it
export const generateLayout = (inactive: number): Layout => {
  const seats: Layout['seats'] = [];
  for (let y = 0; y < STANDARD_ROWS; y++) {
    for (const x of SEAT_X) seats.push({ x, y, type: 'STANDARD', active: true });
  }
  for (const x of COUPLE_X) seats.push({ x, y: STANDARD_ROWS, type: 'COUPLE', active: true });

  const step = Math.floor(seats.length / (inactive + 1));
  for (let i = 1; i <= inactive; i++) seats[i * step].active = false;
  return { rows: STANDARD_ROWS + 1, cols: COLS, seats };
};
