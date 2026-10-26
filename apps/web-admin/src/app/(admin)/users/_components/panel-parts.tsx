import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toastResult } from '@/lib/toast-result';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SheetFooter } from '@/components/ui/sheet';
import { deleteUser, restoreUser, updateUser, type UserPatch } from '../_data/mutations';
import type { Noun } from './noun';

export const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="grid gap-1.5">
    <Label className="text-muted-foreground">{label}</Label>
    <div className="flex min-h-9 items-center text-sm">{children}</div>
  </div>
);

export type Ask = 'save' | 'delete' | 'restore';

const ASK_LABEL: Record<Ask, string> = { save: 'Save', delete: 'Delete', restore: 'Restore' };

type FooterProps = {
  noun: Noun;
  editing: boolean;
  deleted: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onAsk: (ask: Ask) => void;
};

// view: Edit + Delete/Restore; edit: Save + Cancel; each change asks once before it goes through
export const PanelFooter = (p: FooterProps) => (
  <SheetFooter>
    {p.editing ? (
      <>
        <Button onClick={() => p.onAsk('save')}>Save</Button>
        <Button variant="outline" onClick={p.onCancel}>
          Cancel
        </Button>
      </>
    ) : (
      <>
        <Button onClick={p.onEdit}>Edit</Button>
        {p.deleted ? (
          <Button variant="outline" onClick={() => p.onAsk('restore')}>
            Restore
          </Button>
        ) : (
          <Button variant="outline" className="text-destructive" onClick={() => p.onAsk('delete')}>
            Delete {p.noun.singular}
          </Button>
        )}
      </>
    )}
  </SheetFooter>
);

const DONE: Record<Ask, string> = { save: 'saved', delete: 'deleted', restore: 'restored' };

type PanelOptions = { noun: Noun; id: string; getPatch: () => UserPatch; onClose: () => void };

// edit state and the confirmed save, delete and restore shared by both panels
export const usePanelActions = ({ noun, id, getPatch, onClose }: PanelOptions) => {
  const [editing, setEditing] = useState(false);
  const [asking, setAsking] = useState<Ask | null>(null);

  const confirm = async () => {
    if (!asking) return;
    const result =
      asking === 'save'
        ? await updateUser(id, getPatch())
        : asking === 'delete'
          ? await deleteUser(id)
          : await restoreUser(id);
    // after a failure the panel stays open for another try
    if (toastResult(result, `The ${noun.singular} was ${DONE[asking]}.`)) onClose();
  };

  const dialog = (
    <ConfirmDialog
      open={asking !== null}
      onOpenChange={(open) => !open && setAsking(null)}
      title={asking ? `${ASK_LABEL[asking]} this ${noun.singular}?` : ''}
      confirmLabel={asking ? ASK_LABEL[asking] : undefined}
      destructive={asking === 'delete'}
      onConfirm={confirm}
    />
  );

  return { editing, setEditing, setAsking, dialog };
};
