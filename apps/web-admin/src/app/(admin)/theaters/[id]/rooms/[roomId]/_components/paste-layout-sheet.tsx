'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useSeatTypes } from '../../../../_components/seat-types';
import { parseLayout } from '../../../../_data/layout';
import type { Layout } from '../../../../_data/types';

type Props = { open: boolean; onOpenChange: (open: boolean) => void; onApply: (l: Layout) => void };

// the text is a layout copied from another version or room
export const PasteLayoutSheet = ({ open, onOpenChange, onApply }: Props) => {
  const { types } = useSeatTypes();
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  const apply = () => {
    try {
      onApply(parseLayout(text, types));
      setText('');
      setError(false);
      onOpenChange(false);
    } catch {
      setError(true);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Paste layout</SheetTitle>
          <SheetDescription>This replaces everything on the grid.</SheetDescription>
        </SheetHeader>
        <div className="grid gap-2 px-4">
          <textarea
            aria-label="Layout JSON"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-64 w-full rounded-lg border border-input bg-transparent p-3 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              That is not a layout this editor can read.
            </p>
          )}
        </div>
        <SheetFooter>
          <Button onClick={apply} disabled={!text.trim()}>
            Apply
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
