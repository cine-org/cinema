'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { toastResult } from '@/lib/toast-result';
import { Button } from '@/components/ui/button';
import { runLifecycle, type LifecycleAction, type LifecycleEntity } from '../_data/mutations';
import type { TheaterStatus } from '../_data/types';

type Common = {
  entity: LifecycleEntity;
  status: TheaterStatus;
  // what the signed-in user may do; an action they may not do is not shown
  allowed: Record<LifecycleAction, boolean>;
};

const NEXT: Record<TheaterStatus, LifecycleAction[]> = {
  draft: ['activate', 'delete'],
  active: ['deactivate', 'close'],
  inactive: ['activate', 'close'],
  closed: [],
};

const LABEL: Record<LifecycleAction, string> = {
  activate: 'Activate',
  deactivate: 'Set inactive',
  close: 'Close',
  delete: 'Delete',
};

const EFFECT: Record<LifecycleAction, string> = {
  activate: 'It goes live on the web and opens for sale.',
  deactivate: 'It is hidden from the web. Data is kept and it can be activated again.',
  close: 'Closing is permanent: it becomes read-only and cannot be reopened.',
  delete: 'The draft is deleted for good.',
};

const STATE: Record<LifecycleAction, string> = {
  activate: 'active',
  deactivate: 'inactive',
  close: 'closed',
  delete: 'deleted',
};

const DANGER: LifecycleAction[] = ['close', 'delete'];

// one action at a time, asked once before it goes through
const useLifecycle = (entity: LifecycleEntity) => {
  const noun = entity.kind;
  const [pending, setPending] = useState<LifecycleAction | null>(null);

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => !open && setPending(null)}
      title={pending ? `${LABEL[pending]} this ${noun}?` : ''}
      description={pending ? EFFECT[pending] : undefined}
      confirmLabel={pending ? LABEL[pending] : undefined}
      destructive={pending !== null && DANGER.includes(pending)}
      onConfirm={async () => {
        if (!pending) return;
        const result = await runLifecycle(entity, pending);
        toastResult(result, `The ${noun} is now ${STATE[pending]}.`);
      }}
    />
  );

  return { setPending, dialog };
};

type StatusButtonProps = Common & {
  // an action that is shown but cannot run yet, with the reason
  blocked?: Partial<Record<LifecycleAction, string>>;
};

// the one everyday action for the current status, placed at the top of the page
export const StatusButton = ({ entity, status, allowed, blocked = {} }: StatusButtonProps) => {
  const { setPending, dialog } = useLifecycle(entity);
  const action = NEXT[status].find((a) => allowed[a] && !DANGER.includes(a));
  if (!action) return null;

  return (
    <div className="flex items-center gap-3">
      {blocked[action] && (
        <p className="text-sm text-amber-700 dark:text-amber-400">{blocked[action]}</p>
      )}
      <Button disabled={!!blocked[action]} onClick={() => setPending(action)}>
        {LABEL[action]}
      </Button>
      {dialog}
    </div>
  );
};

// closed by default and kept apart, so nobody lands on it by accident
export const DangerZone = ({ entity, status, allowed }: Common) => {
  const noun = entity.kind;
  const { setPending, dialog } = useLifecycle(entity);
  const actions = NEXT[status].filter((a) => allowed[a] && DANGER.includes(a));
  if (actions.length === 0) return null;

  return (
    <details className="group rounded-xl bg-card shadow-sm ring-1 ring-foreground/15">
      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm text-muted-foreground [&::-webkit-details-marker]:hidden">
        Danger zone
        <ChevronDown className="size-4 transition-transform group-open:rotate-180" />
      </summary>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground">
          {actions.includes('close') &&
            `Closing is permanent. To reopen it you must create a new ${noun}. `}
          {actions.includes('delete') && 'Only a draft can be deleted.'}
        </p>
        <div className="flex flex-wrap justify-end gap-2">
          {actions.map((action) => (
            <Button
              key={action}
              variant="outline"
              className="min-w-36 text-destructive"
              onClick={() => setPending(action)}
            >
              {LABEL[action]} {noun}
            </Button>
          ))}
        </div>
      </div>
      {dialog}
    </details>
  );
};
