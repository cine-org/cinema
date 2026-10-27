import { AppException, type AppExceptionOptions } from '@repo/common';

export const IAM_ERROR_CODE = {
  PERMISSION_DENIED: 'IAM.PERMISSION_DENIED',
  ROLE_NOT_FOUND: 'IAM.ROLE_NOT_FOUND',
  INVALID_ROLE: 'IAM.INVALID_ROLE',
  ROLE_KEY_TAKEN: 'IAM.ROLE_KEY_TAKEN',
  ROLE_LOCKED: 'IAM.ROLE_LOCKED',
  UNKNOWN_PERMISSION: 'IAM.UNKNOWN_PERMISSION',
  NOT_INTERNAL_ROLE: 'IAM.NOT_INTERNAL_ROLE',
  ROLE_SCOPE_MISMATCH: 'IAM.ROLE_SCOPE_MISMATCH',
  CLUSTER_NOT_FOUND: 'IAM.CLUSTER_NOT_FOUND',
  THEATER_UNAVAILABLE: 'IAM.THEATER_UNAVAILABLE',
  ACCOUNT_NOT_FOUND: 'IAM.ACCOUNT_NOT_FOUND',
  CUSTOMER_ACCOUNT: 'IAM.CUSTOMER_ACCOUNT',
  ACCOUNT_HAS_ROLE: 'IAM.ACCOUNT_HAS_ROLE',
  SELF_ROLE_CHANGE: 'IAM.SELF_ROLE_CHANGE',
  LAST_ADMIN: 'IAM.LAST_ADMIN',
  ADMIN_EXISTS: 'IAM.ADMIN_EXISTS',
} as const;

export type IamErrorCode = (typeof IAM_ERROR_CODE)[keyof typeof IAM_ERROR_CODE];

// Signed in, but the role lacks what the route needs. `required` names it, so the client can tell
// the user what is missing.
export class PermissionDeniedException extends AppException {
  readonly code = IAM_ERROR_CODE.PERMISSION_DENIED;

  constructor(required: readonly string[], options: AppExceptionOptions = {}) {
    super(options.message ?? `Permission denied: requires ${required.join(', ')}`, {
      ...options,
      details: required.map((permission) => ({
        field: 'permission',
        code: permission,
        message: 'Missing permission',
      })),
    });
  }
}

export class RoleNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_NOT_FOUND;

  constructor({ message = 'Role not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// A custom role with a key or scopes it cannot have.
export class InvalidRoleException extends AppException {
  readonly code = IAM_ERROR_CODE.INVALID_ROLE;

  constructor(reason: string, options: AppExceptionOptions = {}) {
    super(options.message ?? reason, options);
  }
}

export class RoleKeyTakenException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_KEY_TAKEN;

  constructor({ message = 'A role with this key exists', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// SUPER_ADMIN always holds every permission, so the system never loses its administrators.
export class RoleLockedException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_LOCKED;

  constructor({ message = 'This role cannot be edited', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class UnknownPermissionException extends AppException {
  readonly code = IAM_ERROR_CODE.UNKNOWN_PERMISSION;

  constructor(keys: readonly string[], options: AppExceptionOptions = {}) {
    super(options.message ?? 'Unknown or deprecated permissions', {
      ...options,
      details: keys.map((key) => ({
        field: 'permissions',
        code: key,
        message: 'Unknown permission',
      })),
    });
  }
}

// CUSTOMER is given by registration, never by an admin.
export class NotInternalRoleException extends AppException {
  readonly code = IAM_ERROR_CODE.NOT_INTERNAL_ROLE;

  constructor({
    message = 'Only internal roles can be granted',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// A scope the role cannot be granted at, or a cluster or theater that does not match the scope.
export class RoleScopeMismatchException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_SCOPE_MISMATCH;

  constructor({
    message = 'The scope does not match the role',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class ClusterNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.CLUSTER_NOT_FOUND;

  constructor({ message = 'Cluster not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Unknown or closed: nobody is given a role in it.
export class TheaterUnavailableException extends AppException {
  readonly code = IAM_ERROR_CODE.THEATER_UNAVAILABLE;

  constructor({
    message = 'The theater does not exist or is closed',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class AccountNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.ACCOUNT_NOT_FOUND;

  constructor({ message = 'Account not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// An account is a customer or internal, never both.
export class CustomerAccountException extends AppException {
  readonly code = IAM_ERROR_CODE.CUSTOMER_ACCOUNT;

  constructor({
    message = 'A customer account cannot get an internal role',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// Inviting a pending account again with another role or scope.
export class AccountHasRoleException extends AppException {
  readonly code = IAM_ERROR_CODE.ACCOUNT_HAS_ROLE;

  constructor({
    message = 'The account already has another role',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SelfRoleChangeException extends AppException {
  readonly code = IAM_ERROR_CODE.SELF_ROLE_CHANGE;

  constructor({ message = 'Nobody changes their own role', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class LastAdminException extends AppException {
  readonly code = IAM_ERROR_CODE.LAST_ADMIN;

  constructor({
    message = 'The last SUPER_ADMIN keeps the role',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

// The first-admin command runs once.
export class AdminExistsException extends AppException {
  readonly code = IAM_ERROR_CODE.ADMIN_EXISTS;

  constructor({ message = 'A SUPER_ADMIN exists', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
