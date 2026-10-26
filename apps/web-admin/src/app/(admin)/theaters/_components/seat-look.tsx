'use client';

import { cn } from '@/lib/utils';
import type { SeatType } from '../_data/types';
import { useSeatTypes } from './seat-types';

// the grid sets these to fit its width, between a min and a max seat size; samples use the fallback
export const SEAT_W = 'var(--seat-w, 2.75rem)';
export const SEAT_H = 'var(--seat-h, 2rem)';
// a seat for several people is 0.8 of a seat per person, so it does not crowd its neighbours
const PER_PERSON = 0.8;
export const wideWidth = (occupancy: number) => `calc(${SEAT_W} * ${PER_PERSON * occupancy})`;

const SEAT = 'relative flex items-center justify-center text-xs font-bold';

// seat types come from the api, so a per-type color would be looked up here by its code;
// until then types are told apart by shape, and types that share one by the color of the label
type Look = { bg: string; text: string };
const FILL = 'bg-foreground/90';
const LOOKS: Record<string, Look> = {
  VIP: { bg: FILL, text: 'text-amber-300 dark:text-amber-700' },
};
const DEFAULT: Look = { bg: FILL, text: 'text-background' };
const INACTIVE_BORDER = 'border-foreground/90 dark:border-foreground/70';
const INACTIVE: Look = { bg: cn('border', INACTIVE_BORDER), text: 'text-muted-foreground' };

const lookOf = (code: string, active: boolean) => (active ? (LOOKS[code] ?? DEFAULT) : INACTIVE);

// corner radii follow the seat height, so they scale with the map
const RADIUS = 'rounded-[calc(var(--seat-h,2rem)*0.19)]';
const RADIUS_JOIN = 'rounded-[calc(var(--seat-h,2rem)*0.1)]';
const LEFT_OUTER = 'rounded-l-[calc(var(--seat-h,2rem)*0.19)]';
const RIGHT_OUTER = 'rounded-r-[calc(var(--seat-h,2rem)*0.19)]';
const LEFT_JOIN = 'rounded-l-[calc(var(--seat-h,2rem)*0.1)]';
const RIGHT_JOIN = 'rounded-r-[calc(var(--seat-h,2rem)*0.1)]';

// one box per person; the corners where the seats meet are only slightly rounded
const part = (i: number, parts: number) => {
  if (i === 0) return cn(LEFT_OUTER, RIGHT_JOIN);
  return i === parts - 1 ? cn(LEFT_JOIN, RIGHT_OUTER) : RADIUS_JOIN;
};

type BodyProps = { type: SeatType; active: boolean; label: string };

// a seat that holds several people is drawn as that many joined seats
export const SeatBody = ({ type, active, label }: BodyProps) => {
  const parts = type.maxOccupancy;
  if (parts < 2) return label;

  if (!active) {
    // one outlined ticket cut by dashed lines; the label gets a backing so no line crosses it
    return (
      <>
        <span aria-hidden className={cn('absolute inset-0 border', INACTIVE_BORDER, RADIUS)} />
        {Array.from({ length: parts - 1 }, (_, i) => (
          <span
            key={i}
            aria-hidden
            className={cn('absolute inset-y-1 border-l border-dashed', INACTIVE_BORDER)}
            style={{ left: `${((i + 1) / parts) * 100}%` }}
          />
        ))}
        <span className="relative bg-card px-1">{label}</span>
      </>
    );
  }

  return (
    <>
      <span aria-hidden className="absolute inset-0 flex">
        {Array.from({ length: parts }, (_, i) => (
          <span key={i} className={cn('flex-1', part(i, parts), lookOf(type.code, true).bg)} />
        ))}
      </span>
      <span className="relative">{label}</span>
    </>
  );
};

// a joined seat paints its own parts, so only a single seat has a background on the box
export const seatClass = (type: SeatType, active: boolean) => {
  const { bg, text } = lookOf(type.code, active);
  return cn(SEAT, text, type.maxOccupancy < 2 && cn(RADIUS, bg));
};

export const EMPTY_CELL = cn(
  RADIUS,
  'border border-dashed border-foreground/25 hover:bg-foreground/10',
);

// a seat as drawn on the map, for keys and pickers
export const SeatSample = ({
  code = '',
  inactive,
  compact,
}: {
  // an inactive seat looks the same whatever its type, so it needs none
  code?: string;
  inactive?: boolean;
  compact?: boolean;
}) => {
  const type = useSeatTypes().of(code);
  const active = !inactive;
  return (
    <span
      aria-hidden
      className={cn(seatClass(type, active), compact && 'text-base')}
      style={{
        width: type.maxOccupancy > 1 ? wideWidth(type.maxOccupancy) : SEAT_W,
        height: SEAT_H,
        zoom: compact ? 0.6 : undefined,
      }}
    >
      <SeatBody type={type} active={active} label="X01" />
    </span>
  );
};
