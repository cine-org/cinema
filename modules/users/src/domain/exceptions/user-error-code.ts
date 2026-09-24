export const USER_ERROR_CODE = {
  NOT_FOUND: 'USER.NOT_FOUND',
} as const;

export type UserErrorCode = (typeof USER_ERROR_CODE)[keyof typeof USER_ERROR_CODE];
