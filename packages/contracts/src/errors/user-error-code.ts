export const USER_ERROR_CODE = {
  INVALID: 'USER.INVALID',
  NOT_FOUND: 'USER.NOT_FOUND',
  EMAIL_ALREADY_EXISTS: 'USER.EMAIL_ALREADY_EXISTS',
} as const;

export type UserErrorCode = (typeof USER_ERROR_CODE)[keyof typeof USER_ERROR_CODE];
