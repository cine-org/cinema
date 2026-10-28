import { AppException, type AppExceptionOptions } from '@repo/common';

export const IAM_ERROR_CODE = {
  ROLE_NOT_FOUND: 'IAM.ROLE_NOT_FOUND',
  INVALID_ROLE: 'IAM.INVALID_ROLE',
  ROLE_KEY_TAKEN: 'IAM.ROLE_KEY_TAKEN',
  ROLE_LOCKED: 'IAM.ROLE_LOCKED',
  UNKNOWN_PERMISSION: 'IAM.UNKNOWN_PERMISSION',
  SELF_ROLE_CHANGE: 'IAM.SELF_ROLE_CHANGE',
  NOT_INTERNAL_ROLE: 'IAM.NOT_INTERNAL_ROLE',
  ROLE_SCOPE_MISMATCH: 'IAM.ROLE_SCOPE_MISMATCH',
  CLUSTER_NOT_FOUND: 'IAM.CLUSTER_NOT_FOUND',
  THEATER_UNAVAILABLE: 'IAM.THEATER_UNAVAILABLE',
  ACCOUNT_NOT_FOUND: 'IAM.ACCOUNT_NOT_FOUND',
  CUSTOMER_ACCOUNT: 'IAM.CUSTOMER_ACCOUNT',
  LAST_ADMIN: 'IAM.LAST_ADMIN',
} as const;

export type IamErrorCode = (typeof IAM_ERROR_CODE)[keyof typeof IAM_ERROR_CODE];

// Exceptions

export class RoleNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_NOT_FOUND;

  constructor({ message = 'Role not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class InvalidRoleException extends AppException {
  readonly code = IAM_ERROR_CODE.INVALID_ROLE;

  constructor({ message = 'Invalid role', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoleKeyTakenException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_KEY_TAKEN;

  constructor({ message = 'Role key already taken', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoleLockedException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_LOCKED;

  constructor({ message = 'Role cannot be edited', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class UnknownPermissionException extends AppException {
  readonly code = IAM_ERROR_CODE.UNKNOWN_PERMISSION;

  constructor({ message = 'Unknown permission', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Nobody widens or narrows their own access.
export class SelfRoleChangeException extends AppException {
  readonly code = IAM_ERROR_CODE.SELF_ROLE_CHANGE;

  constructor({ message = 'Cannot change your own role', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// The customer role is given by registration, never through the admin.
export class NotInternalRoleException extends AppException {
  readonly code = IAM_ERROR_CODE.NOT_INTERNAL_ROLE;

  constructor({ message = 'Role is not an internal role', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// The scope is not one the role allows, or the cluster or theater does not match it.
export class RoleScopeMismatchException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_SCOPE_MISMATCH;

  constructor({ message = 'Scope does not fit the role', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class ClusterNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.CLUSTER_NOT_FOUND;

  constructor({ message = 'Cluster not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Unknown or closed: nobody is granted a role on a closed theater.
export class TheaterUnavailableException extends AppException {
  readonly code = IAM_ERROR_CODE.THEATER_UNAVAILABLE;

  constructor({ message = 'Theater not available', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class AccountNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.ACCOUNT_NOT_FOUND;

  constructor({ message = 'Account not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Customers sign in on the customer side; staff get their own account by invitation.
export class CustomerAccountException extends AppException {
  readonly code = IAM_ERROR_CODE.CUSTOMER_ACCOUNT;

  constructor({
    message = 'Customer accounts cannot hold an internal role',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class LastAdminException extends AppException {
  readonly code = IAM_ERROR_CODE.LAST_ADMIN;

  constructor({
    message = 'The last super admin must stay',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
