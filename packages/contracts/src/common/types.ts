export type SortOrder = 'asc' | 'desc';

export type SortParam<T extends string = string> = `${T}:${SortOrder}`;

export type SortField<T extends string = string> = {
  field: T;
  order: SortOrder;
};

export type Pagination = {
  page?: number;
  limit?: number;
};
