import { AppException, type AppExceptionOptions } from '@repo/common';
import { AUTH_ERROR_CODE } from './auth-error-code';

export type AuthExceptionOptions = AppExceptionOptions & {
  readonly message?: string;
};

export class EmailAlreadyExistsException extends AppException {
  readonly code = AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS;

  constructor({ message = 'Email already exists', ...options }: AuthExceptionOptions = {}) {
    super(message, options);
  }
}
