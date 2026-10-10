import { AppException, type AppExceptionOptions } from '@repo/common';

export const AUTH_ERROR_CODE = {
  EMAIL_ALREADY_EXISTS: 'AUTH.EMAIL_ALREADY_EXISTS',
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODE)[keyof typeof AUTH_ERROR_CODE];

export class EmailAlreadyExistsException extends AppException {
  readonly code = AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS;

  constructor({ message = 'Email already exists', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
