// TODO: replace with the admin api once it serves dashboard figures. Every block is a total over
// the chosen range, so the api needs a reporting endpoint that takes the same `range`.

export const RANGES = ['today', '7d', '30d'] as const;
export type Range = (typeof RANGES)[number];

export const RANGE_INFO: Record<Range, { label: string; compare: string; factor: number }> = {
  today: { label: 'Today', compare: 'vs yesterday', factor: 1 },
  '7d': { label: '7 days', compare: 'vs previous 7 days', factor: 6.4 },
  '30d': { label: '30 days', compare: 'vs previous 30 days', factor: 26 },
};

export const parseRange = (value: string | string[] | undefined): Range =>
  RANGES.find((r) => r === value) ?? 'today';

// a stable wobble, so the mock does not change between renders
const wave = (n: number, base: number, amp: number, seed: number) =>
  Array.from({ length: n }, (_, i) => Math.round(base * (1 + amp * Math.sin(i * 1.7 + seed))));

const money = (millions: number) =>
  millions >= 1000 ? `${(millions / 1000).toFixed(2)}B ₫` : `${Math.round(millions)}M ₫`;
const count = (n: number) => Math.round(n).toLocaleString('en-US');

export type Kpi = {
  label: string;
  value: string;
  // `good` says whether the change is welcome, which is not always the same as going up
  delta: { text: string; up: boolean; good: boolean };
  spark: number[];
};

const kpis = (range: Range): Kpi[] => {
  const f = RANGE_INFO[range].factor;
  const d = (text: string, up: boolean, good = up) => ({ text, up, good });
  return [
    {
      label: 'Revenue',
      value: money(377 * f * 0.97),
      delta: d('8.6%', true),
      spark: wave(12, 30, 0.35, 1),
    },
    {
      label: 'Tickets sold',
      value: count(2140 * f * 0.97),
      delta: d('5.1%', true),
      spark: wave(12, 30, 0.3, 2),
    },
    {
      label: 'Average occupancy',
      value: `${68 - Math.round(Math.log2(f))}%`,
      delta: d('2.3%', false),
      spark: wave(12, 30, 0.25, 3),
    },
    {
      label: 'Average ticket price',
      value: `${176 - Math.round(Math.log2(f) * 6)}k ₫`,
      delta: d('3.4%', true),
      spark: wave(12, 30, 0.15, 4),
    },
    {
      label: 'Cancellation rate',
      value: `${(3.1 + Math.log2(f) * 0.22).toFixed(1)}%`,
      delta: d('0.4 pt', false, true),
      spark: wave(12, 30, 0.3, 5),
    },
    {
      label: 'Refunds',
      value: money(11 * f * 1.05),
      delta: d('12%', true, false),
      spark: wave(12, 30, 0.4, 6),
    },
    {
      label: 'New users',
      value: count(12 * f * 0.95),
      delta: d('3', true),
      spark: wave(12, 30, 0.3, 7),
    },
    {
      label: 'Repeat customers',
      value: `${41 - Math.round(Math.log2(f))}%`,
      delta: d('1.2 pt', true),
      spark: wave(12, 30, 0.1, 8),
    },
  ];
};

// revenue (millions of VND) and tickets for each point of the trend, split by seat type
export type TrendPoint = {
  label: string;
  revenue: [number, number, number];
  tickets: [number, number, number];
};
export const SEAT_TYPES = ['Standard', 'VIP', 'Couple'] as const;

const split = (total: number): [number, number, number] => {
  const standard = Math.round(total * 0.62);
  const vip = Math.round(total * 0.25);
  return [standard, vip, total - standard - vip];
};

const trendOf = (labels: string[], revenue: number[]): TrendPoint[] =>
  labels.map((label, i) => ({
    label,
    revenue: split(revenue[i]),
    tickets: split(Math.round(revenue[i] * 5.67)),
  }));

const trend = (range: Range): TrendPoint[] => {
  if (range === 'today') {
    return trendOf(
      ['10h', '12h', '14h', '16h', '18h', '20h', '22h'],
      [14, 22, 41, 58, 96, 102, 44],
    );
  }
  if (range === '7d') {
    return trendOf(
      ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      [296, 318, 305, 342, 412, 347, 377],
    );
  }
  return trendOf(
    Array.from({ length: 30 }, (_, i) => String(i + 1)),
    wave(30, 330, 0.2, 3),
  );
};

export type TheaterRow = {
  name: string;
  revenue: string;
  tickets: string;
  occupancy: number;
  delta: { text: string; up: boolean };
};

const THEATERS = [
  { name: 'Cinema Quận 1', revenue: 152, tickets: 860, occupancy: 86, delta: 9.2 },
  { name: 'Cinema Thủ Đức', revenue: 98, tickets: 560, occupancy: 72, delta: 4.1 },
  { name: 'Cinema Đà Nẵng', revenue: 81, tickets: 470, occupancy: 58, delta: -3.5 },
  { name: 'Cinema Cần Thơ', revenue: 46, tickets: 250, occupancy: 41, delta: -7.8 },
];

const theaters = (range: Range): TheaterRow[] => {
  const f = RANGE_INFO[range].factor;
  return THEATERS.map((t) => ({
    name: t.name,
    revenue: money(t.revenue * f),
    tickets: count(t.tickets * f),
    occupancy: Math.max(20, t.occupancy - Math.round(Math.log2(f))),
    delta: { text: `${Math.abs(t.delta)}%`, up: t.delta >= 0 },
  }));
};

export type MovieRow = {
  title: string;
  revenue: string;
  tickets: string;
  occupancy: number;
  share: number;
};

const MOVIES = [
  { title: 'Hành Tinh Thứ Chín', revenue: 96, tickets: 540, occupancy: 91 },
  { title: 'Đêm Cuối Phố Cũ', revenue: 81, tickets: 470, occupancy: 78 },
  { title: 'Mưa Trên Biển Lặng', revenue: 68, tickets: 395, occupancy: 69 },
  { title: 'Thám Tử Ba Mươi', revenue: 52, tickets: 310, occupancy: 55 },
  { title: 'Ngôi Nhà Trên Mây', revenue: 41, tickets: 240, occupancy: 47 },
];

const movies = (range: Range): MovieRow[] => {
  const f = RANGE_INFO[range].factor;
  return MOVIES.map((m) => ({
    title: m.title,
    revenue: money(m.revenue * f),
    tickets: count(m.tickets * f),
    occupancy: m.occupancy,
    share: m.revenue / MOVIES[0].revenue,
  }));
};

export type BookingStatus = { label: 'Confirmed' | 'Cancelled' | 'Refunded'; value: number };

const bookingStatus = (range: Range): BookingStatus[] => {
  const f = RANGE_INFO[range].factor;
  return [
    { label: 'Confirmed', value: Math.round(1420 * f) },
    { label: 'Cancelled', value: Math.round(46 * f) },
    { label: 'Refunded', value: Math.round(18 * f) },
  ];
};

// average occupancy by weekday and showtime slot; it does not depend on the range
export const HEATMAP_HOURS = ['10h', '12h', '14h', '16h', '18h', '20h', '22h'];
export const HEATMAP_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_LOAD = [30, 40, 45, 55, 78, 88, 60];
const DAY_LOAD = [0.8, 0.8, 0.85, 0.9, 1.05, 1.15, 1.1];
export const HEATMAP = DAY_LOAD.map((day) =>
  HOUR_LOAD.map((h) => Math.min(100, Math.round(h * day))),
);

export type ShowtimeStatus = 'On sale' | 'Almost full' | 'Cancelled';

export const UPCOMING_SHOWTIMES: {
  id: string;
  time: string;
  movie: string;
  room: string;
  sold: number;
  capacity: number;
  status: ShowtimeStatus;
}[] = [
  {
    id: 'st1',
    time: '19:30',
    movie: 'Đêm Cuối Phố Cũ',
    room: 'Q1, Room 2',
    sold: 148,
    capacity: 180,
    status: 'On sale',
  },
  {
    id: 'st2',
    time: '20:00',
    movie: 'Hành Tinh Thứ Chín',
    room: 'Q1, Room 1',
    sold: 176,
    capacity: 180,
    status: 'Almost full',
  },
  {
    id: 'st3',
    time: '20:15',
    movie: 'Mưa Trên Biển Lặng',
    room: 'Thủ Đức, Room 3',
    sold: 64,
    capacity: 120,
    status: 'On sale',
  },
  {
    id: 'st4',
    time: '21:00',
    movie: 'Thám Tử Ba Mươi',
    room: 'Đà Nẵng, Room 1',
    sold: 12,
    capacity: 150,
    status: 'On sale',
  },
  {
    id: 'st5',
    time: '21:30',
    movie: 'Ngôi Nhà Trên Mây',
    room: 'Q1, Room 4',
    sold: 0,
    capacity: 96,
    status: 'Cancelled',
  },
];

export type AttentionKind = 'seats' | 'theater' | 'users' | 'role';

export const ATTENTION: { id: string; kind: AttentionKind; text: string; when: string }[] = [
  {
    id: 'at1',
    kind: 'seats',
    text: 'Room 3 in Thủ Đức has 4 inactive seats',
    when: '12 minutes ago',
  },
  { id: 'at2', kind: 'theater', text: 'Cinema Cần Thơ switched to INACTIVE', when: '1 hour ago' },
  { id: 'at3', kind: 'users', text: '12 new users registered today', when: '3 hours ago' },
  { id: 'at4', kind: 'role', text: 'Role “Cashier” gained bookings:update', when: 'Yesterday' },
];

export const getDashboard = (range: Range) => ({
  kpis: kpis(range),
  trend: trend(range),
  theaters: theaters(range),
  movies: movies(range),
  bookingStatus: bookingStatus(range),
});
