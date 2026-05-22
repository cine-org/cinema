import {
  PaginatedResponse as PaginatedResponseContract,
  PaginationMeta as PaginationMetaContract,
} from '@repo/contracts';

export type PaginationMetaInput = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
};

export class PaginationMeta implements PaginationMetaContract {
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPreviousPage: boolean;

  private constructor(input: PaginationMetaInput) {
    const page = Math.max(1, input.page);
    const limit = Math.max(1, input.limit);
    const total = Math.max(0, input.total);
    const totalPages = Math.ceil(total / limit);

    this.page = page;
    this.limit = limit;
    this.total = total;
    this.totalPages = totalPages;
    this.hasNextPage = page < totalPages;
    this.hasPreviousPage = page > 1;
  }

  static of(input: PaginationMetaInput): PaginationMeta {
    return new PaginationMeta(input);
  }
}

export type PaginatedResponseInput<T> = {
  readonly data: T[];
  readonly page: number;
  readonly limit: number;
  readonly total: number;
  readonly message?: string;
};

type PaginatedResponseProps<T> = {
  readonly data: T[];
  readonly meta: PaginationMeta;
  readonly message?: string;
};

export class PaginatedResponse<T> implements PaginatedResponseContract<T> {
  readonly success = true;
  readonly data: T[];
  readonly meta: PaginationMeta;
  readonly message: string;
  readonly timestamp: string;

  private constructor({ data, meta, message = 'OK' }: PaginatedResponseProps<T>) {
    this.data = data;
    this.meta = meta;
    this.message = message;
    this.timestamp = new Date().toISOString();
  }

  static of<T>({
    data,
    page,
    limit,
    total,
    message,
  }: PaginatedResponseInput<T>): PaginatedResponse<T> {
    return new PaginatedResponse({
      data,
      meta: PaginationMeta.of({
        page,
        limit,
        total,
      }),
      message,
    });
  }
}
