'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useSeatTypes } from '../../../../_components/seat-types';
import { capacityOf, clamp, type Range } from '../../../../_data/layout';
import type { Seat } from '../../../../_data/types';

type TileProps = {
  selected: boolean;
  // without it the tile is only a key, not a button anyone can press
  onSelect?: () => void;
  preview: React.ReactNode;
  name: string;
  count?: number;
};

// the whole row picks the type; the seat sits centred in a fixed column so every row shares one axis
export const BrushTile = ({ selected, onSelect, preview, name, count }: TileProps) => {
  const content = (
    <>
      <span className="flex w-14 shrink-0 items-center justify-center">{preview}</span>
      <span className={cn(selected && 'font-medium')}>{name}</span>
      {count !== undefined && (
        <span className="ml-auto text-muted-foreground tabular-nums">{count}</span>
      )}
    </>
  );
  const row = 'flex h-10 w-full items-center gap-3 rounded-md px-2 text-left text-sm';

  return onSelect ? (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        row,
        'relative transition-colors hover:bg-muted/60',
        selected &&
          'bg-muted before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary hover:bg-muted',
      )}
    >
      {content}
    </button>
  ) : (
    <div className={row}>{content}</div>
  );
};

export const Section = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <section className="grid gap-2 border-b border-border px-4 py-3 last:border-b-0">
    {title && <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>}
    {children}
  </section>
);

// the numbers share a right edge with the seat type counts above, so they read as a sum
const Total = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center gap-3 text-sm">
    <span>{label}</span>
    <span className="ml-auto font-medium tabular-nums">{value}</span>
  </div>
);

type FieldProps = {
  label: string;
  name: string;
  value: number;
  // without both the field only shows the value
  limit?: Range;
  onCommit?: (value: number) => void;
};

const FIELD = 'flex h-9 flex-1 items-center gap-2 rounded-md border border-input px-3 text-sm';

// whether typing more digits after `text` can still land inside the range
const canReach = (text: string, { min, max }: Range) =>
  Array.from({ length: max - min + 1 }, (_, i) => String(min + i)).some((n) => n.startsWith(text));

// a grid size box: the label sits inside, the number on the right
export const Field = ({ label, name, value, limit, onCommit }: FieldProps) => {
  // a half-typed size never redraws the grid: it applies on Enter or when the box loses focus
  const [text, setText] = useState<string | null>(null);

  if (!limit || !onCommit)
    return (
      <div className={cn(FIELD, 'bg-muted/40')} aria-label={name}>
        <span className="text-muted-foreground">{label}</span>
        <span className="ml-auto font-medium tabular-nums">{value}</span>
      </div>
    );

  const commit = () => {
    if (text === null) return;
    setText(null);
    // an emptied box keeps the current size
    if (text === '') return;
    const next = clamp(Number(text), limit);
    if (next !== value) onCommit(next);
  };

  // "1" has to be typable on the way to "12", so a short number is only flagged until it is applied
  const short = text !== null && text !== '' && Number(text) < limit.min;
  const step = (by: number) => setText(String(clamp(Number(text ?? value) + by, limit)));

  return (
    <label
      className={cn(
        FIELD,
        'focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
        short &&
          'border-destructive focus-within:border-destructive focus-within:ring-destructive/20',
      )}
    >
      <span className="text-muted-foreground">{label}</span>
      <input
        aria-label={name}
        aria-invalid={short}
        inputMode="numeric"
        value={text ?? (value || '')}
        onChange={(e) => {
          const next = e.target.value;
          if (next === '' || (/^[1-9]\d*$/.test(next) && canReach(next, limit))) setText(next);
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setText(null);
          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            step(e.key === 'ArrowUp' ? 1 : -1);
          }
        }}
        className="w-full min-w-0 bg-transparent text-right font-medium tabular-nums outline-none"
      />
    </label>
  );
};

type TotalsProps = {
  seats: Seat[];
};

export const SeatTotals = ({ seats }: TotalsProps) => {
  const { types } = useSeatTypes();
  return (
    <dl className="mt-1 grid gap-2 border-t border-border pt-3">
      <Total label="Seats" value={seats.length} />
      <Total label="Capacity" value={capacityOf(seats, types)} />
    </dl>
  );
};

type ShellProps = {
  info: React.ReactNode;
  // the buttons of the actions card, under the version picker
  actions: React.ReactNode;
  summary: React.ReactNode;
  // the control in the top right corner of the map
  corner?: React.ReactNode;
  map: React.ReactNode;
};

// the side column and the map; the editor and the viewer fill the same places
export const LayoutShell = ({ info, actions, summary, corner, map }: ShellProps) => (
  <div className="grid gap-4 xl:grid-cols-[18rem_1fr] xl:items-start">
    <div className="grid gap-4 md:grid-cols-2 md:items-start xl:grid-cols-1">
      <div className="grid gap-4">
        {info}
        <Card>
          <CardContent className="grid gap-2">{actions}</CardContent>
        </Card>
      </div>
      <Card className="gap-0 py-0">{summary}</Card>
    </div>
    <Card className="relative gap-0 py-0">
      {corner && <div className="absolute right-3 top-3">{corner}</div>}
      <CardContent className="py-6">{map}</CardContent>
    </Card>
  </div>
);
