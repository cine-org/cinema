import type { CommonErrorCode } from './common-error-code';
import type { UserErrorCode } from './user-error-code';

export type AppErrorCode = CommonErrorCode | UserErrorCode;
