import { IAM_ERROR_CODE } from '@repo/contracts';
import { AppException, type AppExceptionOptions } from '@repo/shared';

export type IamExceptionOptions = AppExceptionOptions & {
  readonly message?: string;
};

export class IamInvalidException extends AppException {
  readonly code = IAM_ERROR_CODE.INVALID;

  constructor({ message = 'Invalid IAM value', ...options }: IamExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoleNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_NOT_FOUND;

  constructor({ message = 'Role not found', ...options }: IamExceptionOptions = {}) {
    super(message, options);
  }
}

export class PermissionNotFoundException extends AppException {
  readonly code = IAM_ERROR_CODE.PERMISSION_NOT_FOUND;

  constructor({ message = 'Permission not found', ...options }: IamExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoleAlreadyExistsException extends AppException {
  readonly code = IAM_ERROR_CODE.ROLE_ALREADY_EXISTS;

  constructor({ message = 'Role already exists', ...options }: IamExceptionOptions = {}) {
    super(message, options);
  }
}

export class PermissionAlreadyExistsException extends AppException {
  readonly code = IAM_ERROR_CODE.PERMISSION_ALREADY_EXISTS;

  constructor({ message = 'Permission already exists', ...options }: IamExceptionOptions = {}) {
    super(message, options);
  }
}

export class SystemRoleImmutableException extends AppException {
  readonly code = IAM_ERROR_CODE.SYSTEM_ROLE_IMMUTABLE;

  constructor({
    message = 'System role cannot be modified',
    ...options
  }: IamExceptionOptions = {}) {
    super(message, options);
  }
}
