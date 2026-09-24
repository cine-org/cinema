import { HttpStatus } from '@nestjs/common';
import { AUTH_ERROR_CODE, type AuthErrorCode } from '@repo/auth';
import { COMMON_ERROR_CODE, type CommonErrorCode } from '@repo/common';
import { USER_ERROR_CODE, type UserErrorCode } from '@repo/users';

// Every code a module can raise; the map below must cover all of them.
export type AppErrorCode = CommonErrorCode | AuthErrorCode | UserErrorCode;

export const ERROR_CODE_HTTP_STATUS: Record<AppErrorCode, HttpStatus> = {
  [COMMON_ERROR_CODE.BAD_REQUEST]: HttpStatus.BAD_REQUEST,
  [COMMON_ERROR_CODE.VALIDATION]: HttpStatus.BAD_REQUEST,
  [COMMON_ERROR_CODE.UNAUTHORIZED]: HttpStatus.UNAUTHORIZED,
  [COMMON_ERROR_CODE.FORBIDDEN]: HttpStatus.FORBIDDEN,
  [COMMON_ERROR_CODE.NOT_FOUND]: HttpStatus.NOT_FOUND,
  [COMMON_ERROR_CODE.TIMEOUT]: HttpStatus.REQUEST_TIMEOUT,
  [COMMON_ERROR_CODE.CONFLICT]: HttpStatus.CONFLICT,
  [COMMON_ERROR_CODE.UNPROCESSABLE_ENTITY]: HttpStatus.UNPROCESSABLE_ENTITY,
  [COMMON_ERROR_CODE.TOO_MANY_REQUESTS]: HttpStatus.TOO_MANY_REQUESTS,
  [COMMON_ERROR_CODE.INTERNAL]: HttpStatus.INTERNAL_SERVER_ERROR,
  [COMMON_ERROR_CODE.NOT_IMPLEMENTED]: HttpStatus.NOT_IMPLEMENTED,
  [COMMON_ERROR_CODE.SERVICE_UNAVAILABLE]: HttpStatus.SERVICE_UNAVAILABLE,
  [COMMON_ERROR_CODE.GATEWAY_TIMEOUT]: HttpStatus.GATEWAY_TIMEOUT,

  [AUTH_ERROR_CODE.EMAIL_ALREADY_EXISTS]: HttpStatus.CONFLICT,

  [USER_ERROR_CODE.NOT_FOUND]: HttpStatus.NOT_FOUND,
} as const;

export function getHttpStatusForErrorCode(code: string): HttpStatus {
  return ERROR_CODE_HTTP_STATUS[code as AppErrorCode] ?? HttpStatus.INTERNAL_SERVER_ERROR;
}
