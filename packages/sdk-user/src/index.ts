import type { components } from './generated/openapi/types';

export type { components, operations, paths } from './generated/openapi/types';

// `code` is a plain string here: the user doc does not list error codes yet.
export type ApiError = components['schemas']['ErrorResponse'];
