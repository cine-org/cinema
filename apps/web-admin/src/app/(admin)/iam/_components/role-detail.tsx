import { PermissionsEditor } from './permissions-editor';
import type { Permission, RoleInfo } from '../_data/types';

export const RoleDetail = ({ role, catalog }: { role: RoleInfo; catalog: Permission[] }) => (
  <div className="min-w-0 flex-1 rounded-xl bg-card shadow-sm ring-1 ring-foreground/15">
    <PermissionsEditor key={role.id} role={role} catalog={catalog} />
  </div>
);
