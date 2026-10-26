'use client';

import { ChevronDown, Pencil } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { actionOf, type PermissionGroup } from '../_data/group-permissions';
import type { Permission } from '../_data/types';

// every state keeps the same box: only border and text color change
const BADGE =
  'inline-flex h-8 items-center rounded-full border px-4 text-xs font-medium transition-colors';
const ON = 'border-emerald-500/60 text-emerald-700 dark:text-emerald-400';

type Props = {
  group: PermissionGroup;
  granted: ReadonlySet<Permission>;
  // a filter opens every section that has a match
  forceOpen: boolean;
  editing: boolean;
  // another section is being edited, or the role is locked
  editDisabled: boolean;
  onEdit: () => void;
  onSave: (next: Set<Permission>) => void;
  onCancel: () => void;
};

export const ResourceSection = ({
  group,
  granted,
  forceOpen,
  editing,
  editDisabled,
  onEdit,
  onSave,
  onCancel,
}: Props) => {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState<Set<Permission>>(new Set());
  const expanded = open || forceOpen || editing;
  const current = editing ? draft : granted;
  const count = group.ids.filter((id) => current.has(id)).length;
  const changed = group.ids.filter((id) => draft.has(id) !== granted.has(id)).length;

  const startEdit = () => {
    setDraft(new Set(group.ids.filter((id) => granted.has(id))));
    onEdit();
  };

  const toggle = (id: Permission) => {
    const next = new Set(draft);
    if (!next.delete(id)) next.add(id);
    setDraft(next);
  };

  return (
    <section className={cn('border-b border-border last:border-b-0', editing && 'bg-muted/30')}>
      <div className="flex items-center gap-3 px-5 py-3">
        <button
          type="button"
          aria-expanded={expanded}
          disabled={editing}
          onClick={() => setOpen(!open)}
          className="flex flex-1 items-center gap-3 text-left"
        >
          <ChevronDown
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              !expanded && '-rotate-90',
            )}
          />
          <span className="font-medium">{group.resource}</span>
          <span className="text-sm text-muted-foreground tabular-nums">
            {count}/{group.ids.length}
          </span>
        </button>

        {editing ? (
          <div className="flex items-center gap-2">
            {changed > 0 && (
              <span className="text-sm text-muted-foreground">
                {changed} {changed === 1 ? 'change' : 'changes'}
              </span>
            )}
            <Button variant="outline" className="h-8" onClick={onCancel}>
              Cancel
            </Button>
            <Button className="h-8" onClick={() => onSave(draft)}>
              Save
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            disabled={editDisabled}
            aria-label={`Edit ${group.resource}`}
            title="Edit"
            onClick={startEdit}
          >
            <Pencil />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-wrap gap-2 px-5 pb-4 pl-12">
          {group.ids.map((id) => {
            const on = current.has(id);
            return editing ? (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(id)}
                className={cn(
                  BADGE,
                  on ? ON : 'border-border text-muted-foreground hover:bg-muted/60',
                )}
              >
                {actionOf(id)}
              </button>
            ) : (
              <span
                key={id}
                className={cn(
                  BADGE,
                  on ? ON : 'border-dashed border-border text-muted-foreground/70',
                )}
              >
                {actionOf(id)}
              </span>
            );
          })}
        </div>
      )}
    </section>
  );
};
