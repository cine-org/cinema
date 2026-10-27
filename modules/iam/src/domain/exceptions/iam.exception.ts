import { AppException, type AppExceptionOptions } from '@repo/common';

export const IAM_ERROR_CODE = {
  PERMISSION_DENIED: 'IAM.PERMISSION_DENIED',
} as const;

export type IamErrorCode = (typeof IAM_ERROR_CODE)[keyof typeof IAM_ERROR_CODE];

// Signed in, but the role lacks what the route needs. `required` names it, so the client can tell
// the user what is missing.
export class PermissionDeniedException extends AppException {
  readonly code = IAM_ERROR_CODE.PERMISSION_DENIED;

  constructor(required: readonly string[], options: AppExceptionOptions = {}) {
    super(options.message ?? `Permission denied: requires ${required.join(', ')}`, {
      ...options,
      details: required.map((permission) => ({
        field: 'permission',
        code: permission,
        message: 'Missing permission',
      })),
    });
  }
}
