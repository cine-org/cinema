export const SYSTEM_ROLE_CODE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  CUSTOMER: 'CUSTOMER',
} as const;

export type SystemRoleCode = (typeof SYSTEM_ROLE_CODE)[keyof typeof SYSTEM_ROLE_CODE];
