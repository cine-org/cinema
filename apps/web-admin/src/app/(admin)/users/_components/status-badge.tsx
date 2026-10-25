import { ToneBadge, type Tone } from '@/components/tone-badge';
import { Badge } from '@/components/ui/badge';
import type { UserStatus } from '../_data/user';

export const STATUS_LABELS: Record<UserStatus, string> = {
  active: 'Active',
  suspended: 'Suspended',
  banned: 'Banned',
};

const STATUS_TONES: Record<UserStatus, Tone> = {
  active: 'success',
  suspended: 'warning',
  banned: 'danger',
};

export const StatusBadge = ({
  status,
  deleted = false,
}: {
  status: UserStatus;
  deleted?: boolean;
}) => (
  <div className="flex items-center gap-1">
    <ToneBadge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</ToneBadge>
    {deleted && <Badge variant="outline">Deleted</Badge>}
  </div>
);
