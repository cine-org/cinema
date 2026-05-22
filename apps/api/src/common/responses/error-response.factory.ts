export type ErrorDetail = {
  readonly field?: string;
  readonly message: string;
  readonly code?: string;
};

export type ErrorResponse = {
  readonly success: false;
  readonly message: string;
  readonly code: string;
  readonly errors?: ErrorDetail[];
  readonly timestamp: string;
  readonly requestId?: string;
};

export type ErrorResponseInput = {
  readonly message: string;
  readonly code?: string;
  readonly errors?: ErrorDetail[];
  readonly requestId?: string;
};

export const COMMON_ERROR_CODE = {
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  TIMEOUT: 'TIMEOUT',
  CONFLICT: 'CONFLICT',
  VALIDATION: 'VALIDATION',
  UNPROCESSABLE_ENTITY: 'UNPROCESSABLE_ENTITY',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  INTERNAL: 'INTERNAL',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT: 'GATEWAY_TIMEOUT',
} as const;

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
