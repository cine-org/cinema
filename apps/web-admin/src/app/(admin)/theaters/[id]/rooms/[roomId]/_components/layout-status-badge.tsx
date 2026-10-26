import { ToneBadge, type Tone } from '@/components/tone-badge';
import type { LayoutStatus } from '../../../../_data/types';

const STATUS: Record<LayoutStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'warning' },
  published: { label: 'Published', tone: 'success' },
  retired: { label: 'Retired', tone: 'muted' },
};

export const LayoutStatusBadge = ({ status }: { status: LayoutStatus }) => (
  <ToneBadge tone={STATUS[status].tone}>{STATUS[status].label}</ToneBadge>
);
