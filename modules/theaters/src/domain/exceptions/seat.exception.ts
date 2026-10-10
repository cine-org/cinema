import { AppException, type AppExceptionOptions } from '@repo/common';

export const SEAT_ERROR_CODE = {
  NOT_FOUND: 'SEAT.NOT_FOUND',
  DUPLICATE_POSITION: 'SEAT.DUPLICATE_POSITION',
  UNKNOWN_TYPE: 'SEAT.UNKNOWN_TYPE',
  INVALID_PLACEMENT: 'SEAT.INVALID_PLACEMENT',
  TYPE_NOT_FOUND: 'SEAT.TYPE_NOT_FOUND',
  TYPE_CODE_TAKEN: 'SEAT.TYPE_CODE_TAKEN',
  TYPE_INVALID: 'SEAT.TYPE_INVALID',
  TYPE_IN_USE: 'SEAT.TYPE_IN_USE',
} as const;

export type SeatErrorCode = (typeof SEAT_ERROR_CODE)[keyof typeof SEAT_ERROR_CODE];

// Exceptions

export class SeatNotFoundException extends AppException {
  readonly code = SEAT_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'Seat not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SeatDuplicatePositionException extends AppException {
  readonly code = SEAT_ERROR_CODE.DUPLICATE_POSITION;

  constructor({ message = 'Duplicate seat position', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SeatUnknownTypeException extends AppException {
  readonly code = SEAT_ERROR_CODE.UNKNOWN_TYPE;

  constructor({ message = 'Unknown seat type', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SeatInvalidPlacementException extends AppException {
  readonly code = SEAT_ERROR_CODE.INVALID_PLACEMENT;

  constructor({ message = 'Invalid seat placement', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SeatTypeNotFoundException extends AppException {
  readonly code = SEAT_ERROR_CODE.TYPE_NOT_FOUND;

  constructor({ message = 'Seat type not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SeatTypeCodeTakenException extends AppException {
  readonly code = SEAT_ERROR_CODE.TYPE_CODE_TAKEN;

  constructor({ message = 'Seat type code already taken', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SeatTypeInvalidException extends AppException {
  readonly code = SEAT_ERROR_CODE.TYPE_INVALID;

  constructor({ message = 'Invalid seat type', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class SeatTypeInUseException extends AppException {
  readonly code = SEAT_ERROR_CODE.TYPE_IN_USE;

  constructor({ message = 'Seat type is used by seats', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
