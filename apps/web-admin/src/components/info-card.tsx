'use client';

import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import type { Result } from '@/lib/result';
import { toastResult } from '@/lib/toast-result';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type InfoField = {
  id: string;
  label: string;
  value: string;
  // a field that is read-only for now, with the reason shown under it
  locked?: string;
};

// a read-only value shown with the fields, such as a count
export type InfoFact = { label: string; value: string };

export type InfoCardProps = {
  // how the toasts name what is saved: "The theater was saved."
  noun: string;
  title: string;
  fields: InfoField[];
  facts?: InfoFact[];
  canEdit: boolean;
  // 'grid' is a full-width card, 'stack' a narrow card for a side column
  layout?: 'grid' | 'stack';
  // grid columns on wide screens, picked so the last row is full
  columns?: 3 | 4;
  onSave: (values: Record<string, string>) => Promise<Result>;
};

export const InfoCard = ({
  noun,
  title,
  fields,
  facts = [],
  canEdit,
  layout = 'grid',
  columns = 3,
  onSave,
}: InfoCardProps) => {
  const stack = layout === 'stack';
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const start = () => {
    setDraft(Object.fromEntries(fields.map((f) => [f.id, f.value])));
    setEditing(true);
  };

  const save = async () => {
    const result = await onSave(draft);
    if (toastResult(result, `The ${noun} was saved.`)) setEditing(false);
  };

  const actionsEl = canEdit && (
    <div className="flex h-8 items-center gap-2">
      {editing ? (
        <>
          <Button size="sm" onClick={() => setConfirming(true)}>
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </>
      ) : stack ? (
        <Button
          size="icon-sm"
          variant="ghost"
          aria-label={`Edit ${title.toLowerCase()}`}
          title={`Edit ${title.toLowerCase()}`}
          onClick={start}
        >
          <Pencil />
        </Button>
      ) : (
        <Button size="sm" variant="outline" onClick={start}>
          <Pencil />
          Edit
        </Button>
      )}
    </div>
  );

  const input = (id: string) => (
    <Input
      id={`info-${id}`}
      className={cn('text-sm', stack ? 'h-9' : 'h-8')}
      value={draft[id] ?? ''}
      onChange={(e) => setDraft({ ...draft, [id]: e.target.value })}
    />
  );

  const valueEl = (id: string, value: string) => (
    <span id={`info-${id}`} className="truncate text-sm font-medium" title={value}>
      {value || <span className="font-normal text-muted-foreground">Not set</span>}
    </span>
  );

  const dialog = (
    <ConfirmDialog
      open={confirming}
      onOpenChange={setConfirming}
      title={`Save ${title.toLowerCase()}?`}
      confirmLabel="Save"
      onConfirm={save}
    />
  );

  if (stack)
    return (
      <Card className="gap-0 py-3">
        <CardContent className="grid gap-0.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{title}</span>
            {actionsEl}
          </div>
          {fields.map(({ id, label, value, locked }) => (
            <div key={id} className="grid content-start gap-1">
              <div className="flex h-9 items-center gap-2 text-sm">
                <Label htmlFor={`info-${id}`} className="w-16 text-muted-foreground">
                  {label}
                </Label>
                {editing && !locked ? (
                  <div className="flex-1">{input(id)}</div>
                ) : (
                  <span className="ml-auto">{valueEl(id, value)}</span>
                )}
              </div>
              {editing && locked && <p className="text-xs text-muted-foreground">{locked}</p>}
            </div>
          ))}
        </CardContent>
        {dialog}
      </Card>
    );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {actionsEl && <CardAction>{actionsEl}</CardAction>}
      </CardHeader>
      <CardContent
        className={cn(
          'grid gap-x-8 gap-y-5 sm:grid-cols-2',
          columns === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3',
        )}
      >
        {fields.map(({ id, label, value, locked }) => (
          <div key={id} className="grid min-w-0 content-start gap-1.5">
            <Label htmlFor={`info-${id}`} className="text-xs font-normal text-muted-foreground">
              {label}
            </Label>
            {editing && !locked ? (
              input(id)
            ) : (
              <div className="flex h-8 items-center">{valueEl(id, value)}</div>
            )}
            {editing && locked && <p className="text-xs text-muted-foreground">{locked}</p>}
          </div>
        ))}
        {facts.map(({ label, value }) => (
          <div key={label} className="grid min-w-0 content-start gap-1.5">
            <span className="text-xs text-muted-foreground">{label}</span>
            <div className="flex h-8 items-center text-sm font-medium tabular-nums">{value}</div>
          </div>
        ))}
      </CardContent>
      {dialog}
    </Card>
  );
};
