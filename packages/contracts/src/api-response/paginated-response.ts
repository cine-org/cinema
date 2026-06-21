export interface PaginationMeta {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  readonly success: true;
  readonly data: T[];
  readonly meta: PaginationMeta;
  readonly message: string;
  readonly timestamp: string;
}
