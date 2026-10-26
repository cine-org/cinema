import type { Access } from '@/lib/access';
import { PERMISSIONS } from '@/lib/permissions';

// TODO: replace with the signed-in user and their permissions and scope once auth is wired.
// To try a narrower view: { type: 'cluster', clusterIds: ['hcm'] }
export const CURRENT_USER = { name: 'Admin User', role: 'Administrator', initials: 'AU' };
export const CURRENT_ACCESS: Access = { permissions: PERMISSIONS, scope: { type: 'global' } };
