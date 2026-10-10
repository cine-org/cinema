import type { SortField, SortOrder } from '@repo/common';

// `?sort=createdAt:desc` on the URL; parsed into SortField from @repo/common.
export type SortParam<T extends string = string> = `${T}:${SortOrder}`;

const SORT_ORDERS: readonly SortOrder[] = ['asc', 'desc'];

// Every allowed `field:order` value, for @IsIn and the Swagger enum.
export function sortValues<T extends string>(fields: readonly T[]): SortParam<T>[] {
  return fields.flatMap((field) => SORT_ORDERS.map((order) => `${field}:${order}` as const));
}

export function toSortField<T extends string>(param: SortParam<T>): SortField<T> {
  const separator = param.lastIndexOf(':');

  return {
    field: param.slice(0, separator) as T,
    order: param.slice(separator + 1) as SortOrder,
  };
}
