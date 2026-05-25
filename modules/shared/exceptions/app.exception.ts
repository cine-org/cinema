import { type ErrorDetail } from '@repo/contracts';
import { APP_EXCEPTION_STATUS, type AppExceptionStatus } from './exception-status';

export type AppErrorCode = string;

export type AppExceptionOptions = {
  readonly message?: string;
  readonly code?: AppErrorCode;
  readonly status?: AppExceptionStatus;
  readonly details?: ErrorDetail[];
  readonly cause?: unknown;
};

type AppExceptionInput = {
  readonly message: string;
  readonly code: AppErrorCode;
  readonly status: AppExceptionStatus;
  readonly details?: ErrorDetail[];
  readonly cause?: unknown;
};

export class AppException extends Error {
  readonly code: AppErrorCode;
  readonly status: AppExceptionStatus;
  readonly details?: ErrorDetail[];
  override readonly cause?: unknown;

  constructor({
    message,
    code,
    status = APP_EXCEPTION_STATUS.INTERNAL,
    details,
    cause,
  }: AppExceptionInput) {
    super(message, { cause });

    this.name = new.target.name;
    this.code = code;
    this.status = status;
    this.details = details;
    this.cause = cause;

    Object.setPrototypeOf(this, new.target.prototype);
    const captureStackTrace = (
      Error as ErrorConstructor & {
        captureStackTrace?: (target: object) => void;
      }
    ).captureStackTrace;
    captureStackTrace?.(this);
  }
}
