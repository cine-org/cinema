import type { components } from './generated/openapi/types';

export type { components, operations, paths } from './generated/openapi/types';

export type ApiError = components['schemas']['ErrorResponse'];
export type ErrorCode = components['schemas']['ErrorCode'];
