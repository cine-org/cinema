export interface SuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly message: string;
  readonly timestamp: string;
}
