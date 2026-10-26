import { ToneBadge, type Tone } from '@/components/tone-badge';
import type { TheaterStatus } from '../_data/types';

const STATUS: Record<TheaterStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'muted' },
  active: { label: 'Active', tone: 'success' },
  inactive: { label: 'Inactive', tone: 'warning' },
  closed: { label: 'Closed', tone: 'danger' },
};

export const TheaterStatusBadge = ({ status }: { status: TheaterStatus }) => (
  <ToneBadge tone={STATUS[status].tone}>{STATUS[status].label}</ToneBadge>
);
