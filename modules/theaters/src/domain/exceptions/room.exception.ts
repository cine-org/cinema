import { AppException, type AppExceptionOptions } from '@repo/common';

export const ROOM_ERROR_CODE = {
  NOT_FOUND: 'ROOM.NOT_FOUND',
  CODE_TAKEN: 'ROOM.CODE_TAKEN',
  INVALID_CODE: 'ROOM.INVALID_CODE',
  CLOSED: 'ROOM.CLOSED',
  IN_USE: 'ROOM.IN_USE',
  NOT_DRAFT: 'ROOM.NOT_DRAFT',
  INVALID_STATUS_TRANSITION: 'ROOM.INVALID_STATUS_TRANSITION',
  LAYOUT_NOT_FOUND: 'ROOM.LAYOUT_NOT_FOUND',
  LAYOUT_INVALID_GRID: 'ROOM.LAYOUT_INVALID_GRID',
  LAYOUT_NOT_DRAFT: 'ROOM.LAYOUT_NOT_DRAFT',
  LAYOUT_NOT_PUBLISHED: 'ROOM.LAYOUT_NOT_PUBLISHED',
  LAYOUT_EMPTY: 'ROOM.LAYOUT_EMPTY',
} as const;

export type RoomErrorCode = (typeof ROOM_ERROR_CODE)[keyof typeof ROOM_ERROR_CODE];

// Exceptions

export class RoomNotFoundException extends AppException {
  readonly code = ROOM_ERROR_CODE.NOT_FOUND;

  constructor({ message = 'Room not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomCodeTakenException extends AppException {
  readonly code = ROOM_ERROR_CODE.CODE_TAKEN;

  constructor({ message = 'Room code already taken', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomInvalidCodeException extends AppException {
  readonly code = ROOM_ERROR_CODE.INVALID_CODE;

  constructor({ message = 'Invalid room code', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomClosedException extends AppException {
  readonly code = ROOM_ERROR_CODE.CLOSED;

  constructor({ message = 'Room is closed', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomInUseException extends AppException {
  readonly code = ROOM_ERROR_CODE.IN_USE;

  constructor({ message = 'Room is still in use', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomNotDraftException extends AppException {
  readonly code = ROOM_ERROR_CODE.NOT_DRAFT;

  constructor({ message = 'Room is no longer a draft', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomInvalidStatusTransitionException extends AppException {
  readonly code = ROOM_ERROR_CODE.INVALID_STATUS_TRANSITION;

  constructor({
    message = 'Invalid room status transition',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomLayoutNotFoundException extends AppException {
  readonly code = ROOM_ERROR_CODE.LAYOUT_NOT_FOUND;

  constructor({ message = 'Room layout not found', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomLayoutInvalidGridException extends AppException {
  readonly code = ROOM_ERROR_CODE.LAYOUT_INVALID_GRID;

  constructor({ message = 'Invalid layout grid size', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomLayoutNotDraftException extends AppException {
  readonly code = ROOM_ERROR_CODE.LAYOUT_NOT_DRAFT;

  constructor({
    message = 'Only a draft layout can be changed',
    ...options
  }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomLayoutNotPublishedException extends AppException {
  readonly code = ROOM_ERROR_CODE.LAYOUT_NOT_PUBLISHED;

  constructor({ message = 'Layout is not published', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}

export class RoomLayoutEmptyException extends AppException {
  readonly code = ROOM_ERROR_CODE.LAYOUT_EMPTY;

  constructor({ message = 'Layout has no seats', ...options }: AppExceptionOptions = {}) {
    super(message, options);
  }
}
