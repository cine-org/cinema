import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS, type EmployeeRole } from '@/lib/roles';

export const RoleBadge = ({ role }: { role: EmployeeRole }) => (
  <Badge variant="secondary">{ROLE_LABELS[role]}</Badge>
);
