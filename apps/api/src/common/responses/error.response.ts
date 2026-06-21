import { COMMON_ERROR_CODE, type ErrorDetail } from '@repo/contracts';
import type { ErrorResponse as IErrorResponse } from '@repo/contracts';

export type ErrorResponseInput = {
  readonly message: string;
  readonly code?: string;
  readonly errors?: ErrorDetail[];
  readonly requestId?: string;
};

type ErrorResponseProps = {
  readonly message: string;
  readonly code: string;
  readonly errors?: ErrorDetail[];
  readonly requestId?: string;
};

export class ErrorResponse implements IErrorResponse {
  readonly success = false;
  readonly message: string;
  readonly code: string;
  readonly errors?: ErrorDetail[];
  readonly timestamp: string;
  readonly requestId?: string;

  private constructor({ message, code, errors, requestId }: ErrorResponseProps) {
    this.message = message;
    this.code = code;
    this.errors = errors;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }

  static of({
    message,
    code = COMMON_ERROR_CODE.INTERNAL,
    errors,
    requestId,
  }: ErrorResponseInput): ErrorResponse {
    return new ErrorResponse({
      message,
      code,
      errors,
      requestId,
    });
  }
}
