'use client';

import { cn } from '@/lib/utils';
import { labelSeats } from '../_data/seat-labels';
import type { Layout, Seat } from '../_data/types';
import { EMPTY_CELL, SEAT_H, SEAT_W, SeatBody, seatClass, wideWidth } from './seat-look';
import { useSeatTypes } from './seat-types';

const SEAT_MIN = '1.75rem';
const SEAT_MAX = '2.75rem';
const GAP = '0.5rem';
const LABEL_W = '2rem';

type Props = {
  layout: Layout;
  // paint: every cell is a button, empty ones included; the editor uses it
  onPaintDown?: (x: number, y: number) => void;
  onPaintEnter?: (x: number, y: number) => void;
  // only the seats are buttons
  onSeatClick?: (x: number, y: number) => void;
  // paint only: a double click on a cell
  onCellDoubleClick?: (x: number, y: number) => void;
};

export const SeatGrid = ({
  layout,
  onPaintDown,
  onPaintEnter,
  onSeatClick,
  onCellDoubleClick,
}: Props) => {
  const { of } = useSeatTypes();
  const { rows, cols, seats } = layout;
  const painting = !!onPaintDown;
  const { codes, rowLetter } = labelSeats(seats);

  // a wide seat sits in its first cell and covers the ones after it
  const anchors = new Map<string, Seat>();
  const covered = new Set<string>();
  for (const s of seats) {
    anchors.set(`${s.x},${s.y}`, s);
    for (let i = 1; i < of(s.type).width; i++) covered.add(`${s.x + i},${s.y}`);
  }

  const cells = [];
  for (let y = 0; y < rows; y++) {
    cells.push(
      <span
        key={`r${y}`}
        className="flex items-center text-sm font-semibold text-muted-foreground"
        style={{ gridColumn: 1, gridRow: y + 1 }}
      >
        {rowLetter.get(y)}
      </span>,
    );
    for (let x = 0; x < cols; x++) {
      const key = `${x},${y}`;
      if (covered.has(key)) continue;
      const seat = anchors.get(key);
      if (!seat && !painting) continue;

      const type = seat && of(seat.type);
      const clickable = painting || (!!seat && !!onSeatClick);
      const Tag = clickable ? 'button' : 'div';
      cells.push(
        <Tag
          key={key}
          {...(clickable && {
            type: 'button' as const,
            'aria-label': codes.get(key) ?? `Aisle ${x + 1}, ${y + 1}`,
            onMouseDown: (e: React.MouseEvent) => {
              e.preventDefault();
              if (painting) onPaintDown?.(x, y);
              else onSeatClick?.(x, y);
            },
            onMouseEnter: () => onPaintEnter?.(x, y),
            onDoubleClick: () => onCellDoubleClick?.(x, y),
          })}
          style={{
            gridColumn: `${x + 2} / span ${type?.width ?? 1}`,
            gridRow: y + 1,
            ...(type &&
              type.maxOccupancy > 1 && {
                width: wideWidth(type.maxOccupancy),
                justifySelf: 'center',
              }),
          }}
          className={cn(
            seat && type ? seatClass(type, seat.active) : EMPTY_CELL,
            clickable && seat && 'cursor-pointer hover:opacity-80',
          )}
        >
          {seat && type && (
            <SeatBody type={type} active={seat.active} label={codes.get(key) ?? ''} />
          )}
        </Tag>,
      );
    }
  }

  return (
    <div className="select-none">
      <div className="mx-auto mb-14 w-4/5 max-w-3xl text-center">
        <div className="h-8 rounded-t-[50%] border-t-[5px] border-foreground/80" />
        <span className="text-sm font-medium text-muted-foreground">Screen</span>
      </div>
      <div className="overflow-x-auto pb-2 [container-type:inline-size]">
        <div
          className="mx-auto grid w-fit gap-2"
          style={
            {
              '--seat-w': `clamp(${SEAT_MIN}, calc((100cqw - 2 * ${LABEL_W} - ${cols + 1} * ${GAP}) / ${cols}), ${SEAT_MAX})`,
              '--seat-h': 'calc(var(--seat-w) * 2 / 2.75)',
              // a spacer as wide as the row labels keeps the seats centered
              gridTemplateColumns: `${LABEL_W} repeat(${cols}, ${SEAT_W}) ${LABEL_W}`,
              gridAutoRows: SEAT_H,
            } as React.CSSProperties
          }
        >
          {cells}
        </div>
      </div>
    </div>
  );
};
