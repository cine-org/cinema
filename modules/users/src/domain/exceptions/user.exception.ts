import { AppException, type AppExceptionOptions } from '@repo/common';

export const USER_ERROR_CODE = {
  NOT_FOUND: 'USER.NOT_FOUND',
} as const;

export type UserErrorCode = (typeof USER_ERROR_CODE)[keyof typeof USER_ERROR_CODE];

export class UserNotFoundException extends AppException {
  readonly code = USER_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'User not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
