export type AccessScope =
  | { type: 'global' }
  | { type: 'cluster'; clusterIds: string[] }
  | { type: 'theater'; theaterIds: string[] };

export type Access = { permissions: readonly string[]; scope: AccessScope };

// what a permission is being used on; a resource without a cluster or theater is global
export type AccessTarget = { clusterId?: string; theaterId?: string };

// a permission only counts inside its scope: a cluster-scoped role cannot touch another cluster
export const can = (access: Access, permission: string, target: AccessTarget = {}) => {
  if (!access.permissions.includes(permission)) return false;
  const { scope } = access;
  if (scope.type === 'global') return true;
  if (scope.type === 'cluster')
    return !!target.clusterId && scope.clusterIds.includes(target.clusterId);
  return !!target.theaterId && scope.theaterIds.includes(target.theaterId);
};

export const canAny = (access: Access, permissions: string[], target?: AccessTarget) =>
  permissions.some((p) => can(access, p, target));
