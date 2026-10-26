'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toastResult } from '@/lib/toast-result';
import { Button } from '@/components/ui/button';
import { SeatGrid } from '../../../../_components/seat-grid';
import { SeatSample } from '../../../../_components/seat-look';
import { useSeatTypes } from '../../../../_components/seat-types';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { layoutJson } from '../../../../_data/layout';
import { saveSeatChanges } from '../../../../_data/mutations';
import type { Layout } from '../../../../_data/types';
import { copyLayout } from './copy-layout';
import { BrushTile, Field, LayoutShell, SeatTotals, Section } from './layout-panel';

type Props = {
  roomId: string;
  version: number;
  // the room info card, first in the side column
  info: React.ReactNode;
  // the version switch, drawn at the top of the actions card
  picker: React.ReactNode;
  layout: Layout;
  // a published layout lets seats go out of service and come back
  canToggleSeats: boolean;
};

export const LayoutViewer = ({ roomId, version, info, picker, layout, canToggleSeats }: Props) => {
  const { types } = useSeatTypes();
  const [seats, setSeats] = useState(layout.seats);
  const [managing, setManaging] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const changes = seats.filter((s, i) => s.active !== layout.seats[i].active);
  const guard = useLeaveGuard(managing && changes.length > 0);

  const toggle = (x: number, y: number) =>
    setSeats((prev) => prev.map((s) => (s.x === x && s.y === y ? { ...s, active: !s.active } : s)));

  const reset = () => setSeats(layout.seats);

  const stop = () => {
    reset();
    setManaging(false);
  };

  const save = async () => {
    const result = await saveSeatChanges(roomId, version, changes);
    if (toastResult(result, 'The seats were updated.')) setManaging(false);
  };

  const used = types.filter((t) => seats.some((s) => s.type === t.code));
  const inactive = seats.filter((s) => !s.active).length;
  const n = changes.length;

  return (
    <>
      <LayoutShell
        info={info}
        actions={
          <>
            {picker}
            {managing ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Click a seat to take it out of service or put it back.
                </p>
                <Button size="lg" disabled={n === 0} onClick={() => setConfirming(true)}>
                  Save{n > 0 && ` (${n})`}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={n === 0}
                    onClick={reset}
                  >
                    Reset
                  </Button>
                  <Button variant="outline" size="lg" className="flex-1" onClick={stop}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              canToggleSeats && (
                <Button size="lg" onClick={() => setManaging(true)}>
                  Manage seats
                </Button>
              )
            )}
          </>
        }
        summary={
          <>
            <Section>
              <div className="flex gap-2">
                <Field label="Rows" name="Rows" value={layout.rows} />
                <Field label="Cols" name="Columns" value={layout.cols} />
              </div>
            </Section>
            <Section title="Seat type">
              <div className="-mx-2 grid gap-0.5">
                {used.map(({ code, name }) => (
                  <BrushTile
                    key={code}
                    selected={false}
                    preview={<SeatSample code={code} compact />}
                    name={name}
                    count={seats.filter((s) => s.type === code).length}
                  />
                ))}
                {(inactive > 0 || managing) && (
                  <BrushTile
                    selected={false}
                    preview={<SeatSample inactive compact />}
                    name="Inactive"
                    count={inactive}
                  />
                )}
              </div>
              <SeatTotals seats={seats} />
            </Section>
          </>
        }
        corner={
          !managing && (
            <Button
              variant="ghost"
              size="icon"
              aria-label="Copy layout"
              title="Copy layout"
              onClick={() => copyLayout(layoutJson(layout))}
            >
              <Copy />
            </Button>
          )
        }
        map={<SeatGrid layout={{ ...layout, seats }} onSeatClick={managing ? toggle : undefined} />}
      />

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Save ${n} seat ${n === 1 ? 'change' : 'changes'}?`}
        description="Seats taken out of service stop being sold; seats put back can be sold again."
        confirmLabel="Save"
        onConfirm={save}
      />
      {guard}
    </>
  );
};
