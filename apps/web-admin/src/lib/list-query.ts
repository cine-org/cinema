// pieces every list query shares as it travels in the URL; the api takes the same params
export type RawParams = Record<string, string | string[] | undefined>;
export type SortDir = 'asc' | 'desc';

export const LIMIT_OPTIONS = [10, 20, 50] as const;
export const DEFAULT_LIMIT = 10;

export const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

// a filter list is "any of"; an empty list means no restriction
export const list = <T extends string>(
  v: string | string[] | undefined,
  allowed: readonly T[],
): T[] => {
  const given = (Array.isArray(v) ? v.join(',') : (v ?? '')).split(',');
  return allowed.filter((a) => given.includes(a));
};

export const pick = <T extends string>(v: string | undefined, allowed: readonly T[], fallback: T) =>
  allowed.find((a) => a === v) ?? fallback;

export const parsePaging = (params: RawParams) => {
  const page = Number(one(params.page));
  const limit = Number(one(params.limit));
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    limit: LIMIT_OPTIONS.find((l) => l === limit) ?? DEFAULT_LIMIT,
  };
};

// defaults are left out to keep the URL short
export const setPaging = (
  params: URLSearchParams,
  { page, limit }: { page: number; limit: number },
) => {
  if (page > 1) params.set('page', String(page));
  if (limit !== DEFAULT_LIMIT) params.set('limit', String(limit));
};
