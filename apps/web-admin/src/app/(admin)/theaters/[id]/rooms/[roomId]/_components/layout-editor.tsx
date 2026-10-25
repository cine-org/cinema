'use client';

import { ClipboardPaste, Copy, Ellipsis, Eraser } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toastResult } from '@/lib/toast-result';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SeatGrid } from '../../../../_components/seat-grid';
import { SeatSample } from '../../../../_components/seat-look';
import { useSeatTypes } from '../../../../_components/seat-types';
import { useLeaveGuard } from '@/components/use-leave-guard';
import { GRID_LIMIT, layoutJson } from '../../../../_data/layout';
import { publishDraft, saveDraftLayout } from '../../../../_data/mutations';
import type { Layout } from '../../../../_data/types';
import { copyLayout } from './copy-layout';
import { BrushTile, Field, LayoutShell, SeatTotals, Section } from './layout-panel';
import { PasteLayoutSheet } from './paste-layout-sheet';
import { AISLE, useLayoutDraft } from './use-layout-draft';

type Props = {
  roomId: string;
  // the room info card, first in the side column
  info: React.ReactNode;
  // the version switch, drawn at the top of the actions card
  picker: React.ReactNode;
  initial: Layout;
  canPublish: boolean;
  isNew?: boolean;
};

export const LayoutEditor = ({ roomId, info, picker, initial, canPublish, isNew }: Props) => {
  const { types } = useSeatTypes();
  const draft = useLayoutDraft(initial);
  const { layout, brush, hasGrid, dirty } = draft;
  const [pasting, setPasting] = useState(false);
  const [confirming, setConfirming] = useState<'publish' | 'reset' | null>(null);
  // a resize that would drop seats waits for a yes
  const [shrinking, setShrinking] = useState<{ rows: number; cols: number; lost: number } | null>(
    null,
  );

  const resizeTo = (rows: number, cols: number) => {
    const lost = draft.lostBy(rows, cols);
    if (lost > 0) setShrinking({ rows, cols, lost });
    else draft.resize(rows, cols);
  };
  const guard = useLeaveGuard(dirty);

  return (
    <>
      <LayoutShell
        info={info}
        actions={
          <>
            {picker}
            {canPublish && !isNew && (
              <Button size="lg" onClick={() => setConfirming('publish')}>
                Publish
              </Button>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={!dirty}
                onClick={async () =>
                  toastResult(await saveDraftLayout(roomId, layout), 'Draft saved.')
                }
              >
                Save draft
              </Button>
              {!isNew && (
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1"
                  disabled={!dirty}
                  onClick={() => setConfirming('reset')}
                >
                  Reset
                </Button>
              )}
            </div>
          </>
        }
        summary={
          <>
            <Section>
              <div className="flex gap-2">
                <Field
                  label="Rows"
                  name="Rows"
                  limit={GRID_LIMIT.rows}
                  value={layout.rows}
                  onCommit={(rows) => resizeTo(rows, layout.cols)}
                />
                <Field
                  label="Cols"
                  name="Columns"
                  limit={GRID_LIMIT.cols}
                  value={layout.cols}
                  onCommit={(cols) => resizeTo(layout.rows, cols)}
                />
              </div>
            </Section>
            <Section title="Seat type">
              <div className="-mx-2 grid gap-0.5" role="group" aria-label="Seat type">
                {types.map(({ code, name }) => (
                  <BrushTile
                    key={code}
                    selected={brush === code}
                    onSelect={() => draft.setBrush(code)}
                    preview={<SeatSample code={code} compact />}
                    name={name}
                    count={layout.seats.filter((s) => s.type === code).length}
                  />
                ))}
                <BrushTile
                  selected={brush === AISLE}
                  onSelect={() => draft.setBrush(AISLE)}
                  preview={<Eraser className="size-4 text-muted-foreground" />}
                  name="Erase"
                />
              </div>
              <SeatTotals seats={layout.seats} />
            </Section>
          </>
        }
        corner={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                className="py-2"
                disabled={!hasGrid}
                onSelect={() => copyLayout(layoutJson(layout))}
              >
                <Copy />
                Copy layout
              </DropdownMenuItem>
              <DropdownMenuItem className="py-2" onSelect={() => setPasting(true)}>
                <ClipboardPaste />
                Paste layout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
        map={
          hasGrid ? (
            <SeatGrid
              layout={layout}
              onPaintDown={draft.startPaint}
              onPaintEnter={draft.continuePaint}
              onCellDoubleClick={draft.erase}
            />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Set the number of rows and columns to start drawing.
            </p>
          )
        }
      />

      <PasteLayoutSheet open={pasting} onOpenChange={setPasting} onApply={draft.replace} />
      <ConfirmDialog
        open={confirming === 'publish'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Publish this layout?"
        description="New showtimes will use it. The current published layout is retired."
        confirmLabel="Publish"
        onConfirm={async () => toastResult(await publishDraft(roomId), 'Layout published.')}
      />
      <ConfirmDialog
        open={confirming === 'reset'}
        onOpenChange={(open) => !open && setConfirming(null)}
        title="Reset the layout?"
        description="Your changes since the last save are discarded."
        confirmLabel="Reset"
        destructive
        onConfirm={draft.reset}
      />
      <ConfirmDialog
        open={shrinking !== null}
        onOpenChange={(open) => !open && setShrinking(null)}
        title="Shrink the grid?"
        description={
          shrinking
            ? `${shrinking.lost} ${shrinking.lost === 1 ? 'seat falls' : 'seats fall'} outside the new size and will be removed.`
            : undefined
        }
        confirmLabel="Shrink"
        destructive
        onConfirm={() => shrinking && draft.resize(shrinking.rows, shrinking.cols)}
      />
      {guard}
    </>
  );
};
