import { USER_ERROR_CODE } from '@repo/contracts';
import { AppException, type AppExceptionOptions } from '@repo/shared';

export type UserExceptionOptions = AppExceptionOptions & {
  readonly message?: string;
};

export class UserInvalidException extends AppException {
  readonly code = USER_ERROR_CODE.INVALID;

  constructor({ message = 'Invalid user value', ...options }: UserExceptionOptions = {}) {
    super(message, options);
  }
}

export class UserNotFoundException extends AppException {
  readonly code = USER_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'User not found', ...options }: UserExceptionOptions = {}) {
    super(message, options);
  }
}

export class UserInvalidStatusTransitionException extends AppException {
  readonly code = USER_ERROR_CODE.INVALID_STATUS_TRANSITION;

  constructor({
    message = 'Invalid user status transition',
    ...options
  }: UserExceptionOptions = {}) {
    super(message, options);
  }
}
