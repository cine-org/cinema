import type { SeatCell, TheaterDetails } from '../src/domain';

export type RoomSeed = {
  readonly code: string;
  readonly name: string;
  readonly status: 'DRAFT' | 'ACTIVE' | 'INACTIVE';
  // Layout versions published then retired before the current one, for a layout history.
  readonly retiredVersions?: number;
  // Seat codes taken out of service, e.g. broken seats.
  readonly brokenSeats?: readonly string[];
};

export type TheaterSeed = {
  readonly details: TheaterDetails;
  readonly status: 'DRAFT' | 'ACTIVE';
  readonly rooms: readonly RoomSeed[];
};

const ROWS = 12;
const COLS = 14;
// Narrowest seat block an aisle may leave on either side.
const MIN_BLOCK = 2;

const randomInt = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

// One or two walkway columns that leave every seat block at least MIN_BLOCK wide.
function randomAisles(): number[] {
  const count = randomInt(1, 2);

  for (;;) {
    const aisles = Array.from({ length: count }, () => randomInt(0, COLS - 1)).sort(
      (a, b) => a - b,
    );
    const bounds = [-1, ...aisles, COLS];

    if (bounds.slice(1).every((x, i) => x - bounds[i]! - 1 >= MIN_BLOCK)) {
      return aisles;
    }
  }
}

// Left cells of 2–4 centred couple seats, 1–2 cells apart, leaving every aisle open.
function coupleSeats(aisles: ReadonlySet<number>): number[] | undefined {
  const options = [2, 3, 4]
    .flatMap((count) =>
      [1, 2].map((gap) => {
        const start = Math.floor((COLS - (2 * count + gap * (count - 1))) / 2);
        return Array.from({ length: count }, (_, i) => start + i * (2 + gap));
      }),
    )
    .filter((xs) => xs.every((x) => !aisles.has(x) && !aisles.has(x + 1)));

  return options[randomInt(0, options.length - 1)];
}

// Standard seats around the aisles; the back row holds the couple seats.
export function randomLayout(): SeatCell[] {
  for (;;) {
    const aisles = new Set(randomAisles());
    const couples = coupleSeats(aisles);
    if (!couples) continue;

    const cells: SeatCell[] = [];
    for (let y = 0; y < ROWS - 1; y++) {
      for (let x = 0; x < COLS; x++) {
        if (!aisles.has(x)) cells.push({ x, y, seatTypeCode: 'STANDARD' });
      }
    }
    couples.forEach((x) => cells.push({ x, y: ROWS - 1, seatTypeCode: 'COUPLE' }));

    return cells;
  }
}

export const LAYOUT_GRID = { gridRows: ROWS, gridCols: COLS };

export const THEATERS: readonly TheaterSeed[] = [
  {
    details: {
      name: 'Cinema Thảo Điền',
      slug: 'cinema-thao-dien',
      streetAddress: '12 Quốc Hương',
      ward: 'Phường An Khánh',
      province: 'Hồ Chí Minh',
      phoneNumber: '+842837441234',
    },
    status: 'ACTIVE',
    rooms: [
      { code: 'R01', name: 'Cinema 1', status: 'ACTIVE', retiredVersions: 1 },
      { code: 'R02', name: 'Cinema 2', status: 'ACTIVE', brokenSeats: ['C05', 'C06'] },
      { code: 'R03', name: 'Cinema 3', status: 'ACTIVE' },
      { code: 'R04', name: 'Cinema 4', status: 'DRAFT' },
    ],
  },
  {
    details: {
      name: 'Cinema Hoàn Kiếm',
      slug: 'cinema-hoan-kiem',
      streetAddress: '36 Hàng Bài',
      ward: 'Phường Hoàn Kiếm',
      province: 'Hà Nội',
      phoneNumber: '+842438256789',
    },
    status: 'ACTIVE',
    rooms: [
      { code: 'R01', name: 'Cinema 1', status: 'ACTIVE' },
      { code: 'R02', name: 'Cinema 2', status: 'ACTIVE' },
      // Under maintenance: opened before, out of service now.
      { code: 'R03', name: 'Cinema 3', status: 'INACTIVE' },
    ],
  },
  {
    details: {
      name: 'Cinema Sơn Trà',
      slug: 'cinema-son-tra',
      streetAddress: '120 Võ Nguyên Giáp',
      ward: 'Phường Sơn Trà',
      province: 'Đà Nẵng',
      phoneNumber: null,
    },
    // Still being set up: admins see it, customers do not.
    status: 'DRAFT',
    rooms: [
      { code: 'R01', name: 'Cinema 1', status: 'DRAFT' },
      { code: 'R02', name: 'Cinema 2', status: 'ACTIVE' },
    ],
  },
];
