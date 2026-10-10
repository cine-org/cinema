import { AppException, type AppExceptionOptions } from '@repo/common';

export const THEATER_ERROR_CODE = {
  NOT_FOUND: 'THEATER.NOT_FOUND',
  SLUG_TAKEN: 'THEATER.SLUG_TAKEN',
  CLOSED: 'THEATER.CLOSED',
  IN_USE: 'THEATER.IN_USE',
  NOT_DRAFT: 'THEATER.NOT_DRAFT',
  INVALID_STATUS_TRANSITION: 'THEATER.INVALID_STATUS_TRANSITION',
} as const;

export type TheaterErrorCode = (typeof THEATER_ERROR_CODE)[keyof typeof THEATER_ERROR_CODE];

// Exceptions

export class TheaterNotFoundException extends AppException {
  readonly code = THEATER_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'Theater not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class TheaterSlugTakenException extends AppException {
  readonly code = THEATER_ERROR_CODE.SLUG_TAKEN;

  constructor({ message = 'Theater slug already taken', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class TheaterClosedException extends AppException {
  readonly code = THEATER_ERROR_CODE.CLOSED;

  constructor({ message = 'Theater is closed', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class TheaterInUseException extends AppException {
  readonly code = THEATER_ERROR_CODE.IN_USE;

  constructor({ message = 'Theater still has rooms', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class TheaterNotDraftException extends AppException {
  readonly code = THEATER_ERROR_CODE.NOT_DRAFT;

  constructor({ message = 'Theater is no longer a draft', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class TheaterInvalidStatusTransitionException extends AppException {
  readonly code = THEATER_ERROR_CODE.INVALID_STATUS_TRANSITION;

  constructor({
    message = 'Invalid theater status transition',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
