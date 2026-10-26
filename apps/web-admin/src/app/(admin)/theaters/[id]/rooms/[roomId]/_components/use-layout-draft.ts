import { useEffect, useMemo, useRef, useState } from 'react';
import { useSeatTypes } from '../../../../_components/seat-types';
import { layoutJson } from '../../../../_data/layout';
import type { Layout, Seat } from '../../../../_data/types';

// an empty cell is an aisle, so erasing is how an aisle is drawn
export const AISLE = 'aisle';

// the layout being drawn: the grid, the seats on it, the brush, and whether it differs from `saved`
export const useLayoutDraft = (saved: Layout) => {
  const { of } = useSeatTypes();
  const [seats, setSeats] = useState<Seat[]>(saved.seats);
  const [rows, setRows] = useState(saved.rows);
  const [cols, setCols] = useState(saved.cols);
  // a seat type code, or AISLE
  const [brush, setBrush] = useState('STANDARD');
  const dragging = useRef(false);

  useEffect(() => {
    const stop = () => (dragging.current = false);
    window.addEventListener('mouseup', stop);
    return () => window.removeEventListener('mouseup', stop);
  }, []);

  const covers = (s: Seat, x: number, y: number, width = 1) =>
    s.y === y && s.x < x + width && s.x + of(s.type).width > x;

  const erase = (x: number, y: number) => setSeats((prev) => prev.filter((s) => !covers(s, x, y)));

  const paint = (x: number, y: number) => {
    if (brush === AISLE) return erase(x, y);
    const { width } = of(brush);
    if (x + width > cols) return;
    // a new seat replaces whatever it lands on
    setSeats((prev) => [
      ...prev.filter((s) => !covers(s, x, y, width)),
      { x, y, type: brush, active: true },
    ]);
  };

  const replace = (layout: Layout) => {
    setRows(layout.rows);
    setCols(layout.cols);
    setSeats(layout.seats);
  };

  const fits = (s: Seat, r: number, c: number) => s.y < r && s.x + of(s.type).width <= c;

  // seats that no longer fit the grid are dropped
  const resize = (nextRows: number, nextCols: number) => {
    setRows(nextRows);
    setCols(nextCols);
    setSeats((prev) => prev.filter((s) => fits(s, nextRows, nextCols)));
  };

  const layout: Layout = { rows, cols, seats };
  const savedJson = useMemo(() => layoutJson(saved), [saved]);
  const currentJson = useMemo(() => layoutJson({ rows, cols, seats }), [rows, cols, seats]);

  return {
    layout,
    brush,
    setBrush,
    hasGrid: rows > 0 && cols > 0,
    dirty: currentJson !== savedJson,
    resize,
    // how many seats a resize would drop
    lostBy: (r: number, c: number) => seats.filter((s) => !fits(s, r, c)).length,
    reset: () => replace(saved),
    replace,
    erase,
    startPaint: (x: number, y: number) => {
      dragging.current = true;
      paint(x, y);
    },
    continuePaint: (x: number, y: number) => dragging.current && paint(x, y),
  };
};
