'use client';

import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { SearchInput } from '@/components/search-input';
import { toastResult } from '@/lib/toast-result';
import { ROLE_LABELS } from '@/lib/roles';
import { groupPermissions } from '../_data/group-permissions';
import { saveRolePermissions } from '../_data/mutations';
import type { Permission, RoleInfo } from '../_data/types';
import { ResourceSection } from './resource-section';
import { DuplicateRoleButton } from './role-actions';

type Props = { role: RoleInfo; catalog: Permission[] };

export const PermissionsEditor = ({ role, catalog }: Props) => {
  const [saved, setSaved] = useState<Set<Permission>>(() => new Set(role.permissions));
  // one resource at a time, so a change is always easy to trace
  const [editing, setEditing] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  // the super admin keeps every permission
  const locked = role.id === 'super_admin';

  const groups = useMemo(() => groupPermissions(catalog), [catalog]);
  const needle = filter.trim().toLowerCase();
  const shown = groups.filter(
    (g) => !needle || g.resource.includes(needle) || g.ids.some((id) => id.includes(needle)),
  );

  const saveGroup = async (resource: string, next: Set<Permission>) => {
    const ids = groups.find((g) => g.resource === resource)?.ids ?? [];
    const merged = new Set([...saved].filter((id) => !ids.includes(id)));
    for (const id of next) merged.add(id);
    const result = await saveRolePermissions(role.id, [...merged]);
    if (!toastResult(result, 'Permissions saved.')) return;
    setSaved(merged);
    setEditing(null);
  };

  return (
    <div>
      {/* always two rows: identity and action, then the filter beside the permission count */}
      <div className="grid gap-4 border-b border-border px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="truncate text-lg font-semibold">{ROLE_LABELS[role.id]}</h2>
            <Badge variant="secondary" className="shrink-0">
              {role.users} users
            </Badge>
          </div>
          <DuplicateRoleButton roleId={role.id} />
        </div>
        <div className="flex items-center gap-3">
          <SearchInput
            wrapperClassName="min-w-0 flex-1"
            aria-label="Filter permissions"
            placeholder="Filter permissions"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <Badge variant="secondary" className="shrink-0">
            {saved.size}/{catalog.length} granted
          </Badge>
        </div>
      </div>

      {shown.map((group) => (
        <ResourceSection
          key={group.resource}
          group={group}
          granted={saved}
          forceOpen={needle !== ''}
          editing={editing === group.resource}
          editDisabled={locked || editing !== null}
          onEdit={() => setEditing(group.resource)}
          onSave={(next) => saveGroup(group.resource, next)}
          onCancel={() => setEditing(null)}
        />
      ))}
      {shown.length === 0 && (
        <p className="p-8 text-center text-sm text-muted-foreground">No permissions match.</p>
      )}
    </div>
  );
};
