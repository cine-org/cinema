'use client';

import { Copy, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toastResult } from '@/lib/toast-result';
import { createRole, duplicateRole } from '../_data/mutations';

export const AddRoleButton = () => (
  <Button
    variant="outline"
    size="icon-sm"
    aria-label="Add role"
    onClick={async () => toastResult(await createRole(), 'The role was created.')}
  >
    <Plus />
  </Button>
);

export const DuplicateRoleButton = ({ roleId }: { roleId: string }) => (
  <Button
    variant="outline"
    className="h-10"
    aria-label="Duplicate role"
    onClick={async () => toastResult(await duplicateRole(roleId), 'The role was duplicated.')}
  >
    <Copy />
    <span className="hidden sm:inline">Duplicate</span>
  </Button>
);
