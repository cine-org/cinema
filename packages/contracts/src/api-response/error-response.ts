export interface ErrorDetail {
  readonly field?: string;
  readonly message: string;
  readonly code?: string;
}

export interface ErrorResponse {
  readonly success: false;
  readonly message: string;
  readonly code: string;
  readonly errors?: ErrorDetail[];
  readonly timestamp: string;
  readonly requestId?: string;
}
