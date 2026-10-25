import { ToneBadge } from '@/components/tone-badge';

export const VerifiedBadge = ({ verified }: { verified: boolean }) => (
  <ToneBadge tone={verified ? 'success' : 'warning'}>
    {verified ? 'Verified' : 'Unverified'}
  </ToneBadge>
);
