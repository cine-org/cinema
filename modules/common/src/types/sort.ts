export type SortOrder = 'asc' | 'desc';

export type SortField<T extends string = string> = {
  readonly field: T;
  readonly order: SortOrder;
};
