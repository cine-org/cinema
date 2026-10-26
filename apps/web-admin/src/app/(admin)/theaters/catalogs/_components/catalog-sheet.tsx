'use client';

import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toastResult } from '@/lib/toast-result';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { deleteCatalogItem, saveCatalogItem } from '../../_data/mutations';
import type { Catalog, CatalogRow } from '../../_data/types';

type FormProps = {
  catalog: Catalog;
  // the item being edited; null is the add form
  row: CatalogRow | null;
  canUpdate: boolean;
  canDelete: boolean;
  onClose: () => void;
};

// mounted only while the sheet is open, so every opening starts from the item's own values
const CatalogForm = ({ catalog, row, canUpdate, canDelete, onClose }: FormProps) => {
  const { id, title, noun, columns } = catalog;
  const [code, setCode] = useState(row?.code ?? '');
  const [values, setValues] = useState<Record<string, string>>(row?.values ?? {});
  const [confirming, setConfirming] = useState<'save' | 'delete' | null>(null);

  const submit = async () => {
    const result =
      confirming === 'delete' && row
        ? await deleteCatalogItem(id, row.code)
        : await saveCatalogItem(id, row?.code ?? null, row ? values : { code, ...values });
    if (toastResult(result, `The ${noun} was saved.`)) onClose();
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <SheetHeader>
        <SheetTitle>{row ? row.values.name : `Add ${noun}`}</SheetTitle>
        <SheetDescription>{row ? row.code : title}</SheetDescription>
      </SheetHeader>
      <div className="grid flex-1 content-start gap-4 px-4">
        <div className="grid gap-1.5">
          <Label htmlFor={`${id}-code`} className="text-muted-foreground">
            Code
          </Label>
          <Input
            id={`${id}-code`}
            value={code}
            disabled={!!row}
            onChange={(e) => setCode(e.target.value)}
          />
          {row && <p className="text-xs text-muted-foreground">The code never changes.</p>}
        </div>
        {columns.map((c) => (
          <div key={c.id} className="grid gap-1.5">
            <Label htmlFor={`${id}-${c.id}`} className="text-muted-foreground">
              {c.label}
            </Label>
            <Input
              id={`${id}-${c.id}`}
              value={values[c.id] ?? ''}
              disabled={!!row && !canUpdate}
              onChange={(e) => setValues({ ...values, [c.id]: e.target.value })}
            />
          </div>
        ))}
      </div>
      <SheetFooter>
        {(!row || canUpdate) && <Button onClick={() => setConfirming('save')}>Save</Button>}
        {row && canDelete && (
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setConfirming('delete')}
          >
            Delete {noun}
          </Button>
        )}
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </SheetFooter>
      <ConfirmDialog
        open={confirming !== null}
        onOpenChange={(next) => !next && setConfirming(null)}
        title={confirming === 'delete' ? `Delete this ${noun}?` : `Save this ${noun}?`}
        confirmLabel={confirming === 'delete' ? 'Delete' : 'Save'}
        destructive={confirming === 'delete'}
        onConfirm={submit}
      />
    </div>
  );
};

type Props = FormProps & { open: boolean };

export const CatalogSheet = ({ open, ...form }: Props) => (
  <Sheet open={open} onOpenChange={(next) => !next && form.onClose()}>
    <SheetContent>
      <CatalogForm {...form} />
    </SheetContent>
  </Sheet>
);
