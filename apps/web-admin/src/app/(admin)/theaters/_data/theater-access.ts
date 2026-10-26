import { can } from '@/lib/access';
import { CURRENT_ACCESS } from '../../_data/mock-session';
import type { Theater } from './types';

const targetOf = (t: Theater) => ({ clusterId: t.clusterId, theaterId: t.id });

// what the signed-in user may do inside one theater
export const accessFor = (theater: Theater) => {
  const target = targetOf(theater);
  return (permission: string) => can(CURRENT_ACCESS, permission, target);
};
