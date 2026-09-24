// What a list query receives; defaults and limits are applied by the app before this.
export type PageRequest = {
  readonly page: number;
  readonly limit: number;
};

// One page of a list query; apps map `items` to DTOs and keep the rest.
export type Page<T> = PageRequest & {
  readonly items: T[];
  readonly total: number;
};
