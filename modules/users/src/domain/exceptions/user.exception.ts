import { AppException, type AppExceptionOptions } from '@repo/common';
import { USER_ERROR_CODE } from './user-error-code';

export type UserExceptionOptions = AppExceptionOptions & {
  readonly message?: string;
};

export class UserNotFoundException extends AppException {
  readonly code = USER_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'User not found', ...options }: UserExceptionOptions = {}) {
    super(message, options);
  }
}
