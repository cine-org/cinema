import { COMMON_ERROR_CODE, type ErrorDetail, type ErrorResponse } from '@repo/contracts';

export type ErrorResponseInput = {
  readonly message: string;
  readonly code?: string;
  readonly errors?: ErrorDetail[];
  readonly requestId?: string;
};

export const createErrorResponse = ({
  message,
  code = COMMON_ERROR_CODE.INTERNAL,
  errors,
  requestId,
}: ErrorResponseInput): ErrorResponse => ({
  success: false,
  message,
  code,
  errors,
  timestamp: new Date().toISOString(),
  requestId,
});
