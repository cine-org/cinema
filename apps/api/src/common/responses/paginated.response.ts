import { applyDecorators, HttpCode, HttpStatus, type Type } from '@nestjs/common';
import { ApiExtraModels, ApiProperty, ApiResponse } from '@nestjs/swagger';
import type { Page } from '@repo/common';
import { envelopeSchema, listOf, ResponseEnvelope } from './response-envelope';

export type PaginationMetaInput = {
  readonly page: number;
  readonly limit: number;
  readonly total: number;
};

export class PaginationMeta {
  @ApiProperty({ example: 42 })
  readonly total: number;

  @ApiProperty({ example: 1 })
  readonly page: number;

  @ApiProperty({ example: 20 })
  readonly limit: number;

  @ApiProperty({ example: 3 })
  readonly totalPages: number;

  @ApiProperty({ example: true })
  readonly hasNextPage: boolean;

  @ApiProperty({ example: false })
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

export class PaginatedResponse<T> {
  @ApiProperty({ type: Boolean, enum: [true] })
  readonly success = true;

  // Documented per route by @ApiPaginated.
  readonly data: T[];

  @ApiProperty({ type: PaginationMeta })
  readonly meta: PaginationMeta;

  @ApiProperty({ example: 'OK' })
  readonly message: string;

  @ApiProperty({ format: 'date-time' })
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

  // A module's Page into this contract: items → data, the rest → meta.
  static fromPage<T>({ items, ...meta }: Page<T>): PaginatedResponse<T> {
    return PaginatedResponse.of({ data: items, ...meta });
  }
}

type ApiPaginatedOptions = {
  readonly description?: string;
};

// Documents `PaginatedResponse<Dto>`; the route returns `Page<Dto>` from @repo/common.
export function ApiPaginated(dto: Type, { description }: ApiPaginatedOptions = {}) {
  return applyDecorators(
    ResponseEnvelope('paginated'),
    HttpCode(HttpStatus.OK),
    ApiExtraModels(PaginatedResponse, dto),
    ApiResponse({
      status: HttpStatus.OK,
      description,
      schema: envelopeSchema(PaginatedResponse, listOf(dto)),
    }),
  );
}
