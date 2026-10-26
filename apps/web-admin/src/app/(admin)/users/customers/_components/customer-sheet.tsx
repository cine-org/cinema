'use client';

import { useState } from 'react';
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
import type { Customer } from '../_data/mock-customers';

type Props = { customer: Customer | null; onClose: () => void; noun: Noun };

export const CustomerSheet = ({ customer, onClose, noun }: Props) => (
  <Sheet open={customer !== null} onOpenChange={(open) => !open && onClose()}>
    <SheetContent>
      {/* keyed so the panel restarts in view mode for each customer */}
      {customer && (
        <CustomerPanel key={customer.id} customer={customer} onClose={onClose} noun={noun} />
      )}
    </SheetContent>
  </Sheet>
);

const CustomerPanel = ({
  customer,
  onClose,
  noun,
}: {
  customer: Customer;
  onClose: () => void;
  noun: Noun;
}) => {
  const [status, setStatus] = useState(customer.status);
  const [verified, setVerified] = useState(customer.isEmailVerified);
  const actions = usePanelActions({
    noun,
    id: customer.id,
    getPatch: () => ({ status, isEmailVerified: verified }),
    onClose,
  });

  const cancel = () => {
    setStatus(customer.status);
    setVerified(customer.isEmailVerified);
    actions.setEditing(false);
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{customer.fullName ?? 'No name'}</SheetTitle>
        <SheetDescription>{customer.email ?? 'No email'}</SheetDescription>
      </SheetHeader>

      <div className="grid gap-4 px-4">
        <VerifiedField verified={verified} editing={actions.editing} onChange={setVerified} />
        <StatusField
          status={status}
          deleted={customer.deletedAt !== null}
          editing={actions.editing}
          onChange={setStatus}
        />
        <Field label="Date of birth">{formatDate(customer.dateOfBirth)}</Field>
        {customer.deletedAt && <Field label="Deleted">{formatDate(customer.deletedAt)}</Field>}
        <Field label="Created">{formatDate(customer.createdAt)}</Field>
        <Field label="ID">
          <span className="font-mono text-xs text-muted-foreground">{customer.id}</span>
        </Field>
      </div>

      <PanelFooter
        noun={noun}
        editing={actions.editing}
        deleted={customer.deletedAt !== null}
        onEdit={() => actions.setEditing(true)}
        onCancel={cancel}
        onAsk={actions.setAsking}
      />
      {actions.dialog}
    </>
  );
};
