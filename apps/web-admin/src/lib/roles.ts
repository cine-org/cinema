// TODO: roles and scopes come from the api once employee accounts exist there
export const ROLE_VALUES = [
  'super_admin',
  'content_manager',
  'customer_support',
  'cluster_manager',
  'theater_manager',
  'box_office',
  'usher',
] as const;
export type EmployeeRole = (typeof ROLE_VALUES)[number];

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  super_admin: 'Super admin',
  content_manager: 'Content manager',
  customer_support: 'Customer support',
  cluster_manager: 'Cluster manager',
  theater_manager: 'Theater manager',
  box_office: 'Box office',
  usher: 'Usher',
};

export const SCOPE_TYPES = ['global', 'cluster', 'theater'] as const;
export type EmployeeScope = (typeof SCOPE_TYPES)[number];
export const SCOPE_LABELS: Record<EmployeeScope, string> = {
  global: 'Global',
  cluster: 'Cluster',
  theater: 'Theater',
};

// the scopes a role can be given; a single entry means the role is locked to it
export const ROLE_SCOPES: Record<EmployeeRole, readonly EmployeeScope[]> = {
  super_admin: ['global'],
  content_manager: ['global'],
  customer_support: ['global', 'cluster', 'theater'],
  cluster_manager: ['cluster'],
  theater_manager: ['theater'],
  box_office: ['theater'],
  usher: ['theater'],
};
