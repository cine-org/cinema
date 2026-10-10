export type ErrorDetail = {
  readonly field?: string;
  readonly message: string;
  readonly code?: string;
};

export type AppExceptionOptions = {
  readonly message?: string;
  readonly details?: ErrorDetail[];
  readonly cause?: unknown;
};

export abstract class AppException extends Error {
  abstract readonly code: string;
  readonly details?: ErrorDetail[];
  readonly isOperational = true;
  override readonly cause?: unknown;

  constructor(message: string, { details, cause }: Omit<AppExceptionOptions, 'message'> = {}) {
    super(message, { cause });

    this.name = new.target.name;
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
