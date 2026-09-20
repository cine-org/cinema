import type { CommonErrorCode } from './common-error-code';
import type { UserErrorCode } from './user-error-code';
import type { AuthErrorCode } from './auth-error-code';
import type { IamErrorCode } from './iam-error-code';

export type AppErrorCode = CommonErrorCode | UserErrorCode | AuthErrorCode | IamErrorCode;
