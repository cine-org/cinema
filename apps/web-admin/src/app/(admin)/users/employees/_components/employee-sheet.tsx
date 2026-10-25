'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDate } from '@/lib/format-date';
import type { Noun } from '../../_components/noun';
import { Field, PanelFooter, usePanelActions } from '../../_components/panel-parts';
import { StatusField, VerifiedField } from '../../_components/user-fields';
import type { Employee } from '../_data/mock-employees';
import {
  ROLE_LABELS,
  ROLE_SCOPES,
  ROLE_VALUES,
  SCOPE_LABELS,
  type EmployeeRole,
  type EmployeeScope,
} from '@/lib/roles';
import { RoleBadge } from './role-badge';

type Props = { employee: Employee | null; onClose: () => void; noun: Noun };

export const EmployeeSheet = ({ employee, onClose, noun }: Props) => (
  <Sheet open={employee !== null} onOpenChange={(open) => !open && onClose()}>
    <SheetContent>
      {/* keyed so the panel restarts in view mode for each employee */}
      {employee && (
        <EmployeePanel key={employee.id} employee={employee} onClose={onClose} noun={noun} />
      )}
    </SheetContent>
  </Sheet>
);

const EmployeePanel = ({
  employee,
  onClose,
  noun,
}: {
  employee: Employee;
  onClose: () => void;
  noun: Noun;
}) => {
  const [status, setStatus] = useState(employee.status);
  const [role, setRole] = useState<EmployeeRole>(employee.role);
  const [scope, setScope] = useState<EmployeeScope>(employee.scope);
  const [verified, setVerified] = useState(employee.isEmailVerified);
  const actions = usePanelActions({
    noun,
    id: employee.id,
    getPatch: () => ({ status, role, scope, isEmailVerified: verified }),
    onClose,
  });

  // keep the scope inside what the new role allows
  const changeRole = (next: EmployeeRole) => {
    setRole(next);
    if (!ROLE_SCOPES[next].includes(scope)) setScope(ROLE_SCOPES[next][0]);
  };

  const cancel = () => {
    setStatus(employee.status);
    setRole(employee.role);
    setScope(employee.scope);
    setVerified(employee.isEmailVerified);
    actions.setEditing(false);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{employee.fullName ?? 'No name'}</SheetTitle>
        <SheetDescription>{employee.email ?? 'No email'}</SheetDescription>
      </SheetHeader>

      <div className="grid gap-4 px-4">
        <VerifiedField verified={verified} editing={actions.editing} onChange={setVerified} />
        <StatusField
          status={status}
          deleted={employee.deletedAt !== null}
          editing={actions.editing}
          onChange={setStatus}
        />
        <Field label="Role">
          {actions.editing ? (
            <Select value={role} onValueChange={(v) => changeRole(v as EmployeeRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_VALUES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {ROLE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <RoleBadge role={employee.role} />
          )}
        </Field>
        <Field label="Scope">
          {actions.editing ? (
            <Select
              value={scope}
              onValueChange={(v) => setScope(v as EmployeeScope)}
              disabled={ROLE_SCOPES[role].length === 1}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_SCOPES[role].map((value) => (
                  <SelectItem key={value} value={value}>
                    {SCOPE_LABELS[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            SCOPE_LABELS[employee.scope]
          )}
        </Field>
        {employee.deletedAt && <Field label="Deleted">{formatDate(employee.deletedAt)}</Field>}
        <Field label="Created">{formatDate(employee.createdAt)}</Field>
        <Field label="ID">
          <span className="font-mono text-xs text-muted-foreground">{employee.id}</span>
        </Field>
      </div>

      <PanelFooter
        noun={noun}
        editing={actions.editing}
        deleted={employee.deletedAt !== null}
        onEdit={() => actions.setEditing(true)}
        onCancel={cancel}
        onAsk={actions.setAsking}
      />
      {actions.dialog}
    </>
  );
};
