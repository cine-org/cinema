import type { SortOrder } from '@repo/common';

// `?sort=createdAt:desc` on the URL; parsed into SortField from @repo/common.
export type SortParam<T extends string = string> = `${T}:${SortOrder}`;
