import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, type EmployeeRole } from '@/lib/roles';
import type { RoleInfo } from '../_data/types';
import { AddRoleButton } from './role-actions';

export const RolesList = ({ roles, selected }: { roles: RoleInfo[]; selected: EmployeeRole }) => (
  <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/15 lg:w-80 lg:shrink-0 lg:self-start">
    <div className="flex items-center justify-between border-b border-border px-5 py-4">
      <h2 className="text-lg font-semibold">Roles</h2>
      <AddRoleButton />
    </div>
    <ul className="grid gap-1 p-3">
      {roles.map((role) => (
        <li key={role.id}>
          <Link
            href={`/iam?role=${role.id}`}
            aria-current={role.id === selected ? 'page' : undefined}
            className={cn(
              'flex items-center justify-between rounded-lg gap-3 px-4 py-3.5 text-base hover:bg-muted/60',
              role.id === selected && 'bg-muted font-medium',
            )}
          >
            <span className="min-w-0 truncate">{ROLE_LABELS[role.id]}</span>
            <span className="min-w-7 shrink-0 rounded-full bg-background px-2 py-0.5 text-center text-xs font-normal text-muted-foreground tabular-nums ring-1 ring-border">
              {role.users}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);
