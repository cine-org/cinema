import { Injectable } from '@nestjs/common';
import type { Page, PageRequest, SortField } from '@repo/common';
import type { TheaterStatus } from '../../domain';
import { TheaterReadRepository } from '../port';
import type { TheaterView } from '../views';

export const THEATER_SORT_FIELDS = ['name', 'createdAt'] as const;

export type TheaterSortField = (typeof THEATER_SORT_FIELDS)[number];

export type TheaterListFilter = {
  readonly status?: TheaterStatus;
  readonly province?: string;
  // Matches part of the name.
  readonly q?: string;
  // Only the theaters of these clusters plus these theaters: what a cluster or theater role may see.
  readonly within?: {
    readonly clusterIds: readonly string[];
    readonly theaterIds: readonly string[];
  };
};

export type ListTheatersQueryProps = {
  readonly filter: TheaterListFilter;
  readonly sort: SortField<TheaterSortField>;
  readonly page: PageRequest;
};

export class ListTheatersQuery {
  constructor(readonly props: ListTheatersQueryProps) {}
}

@Injectable()
export class ListTheatersHandler {
  constructor(private readonly theaters: TheaterReadRepository) {}

  async execute(query: ListTheatersQuery): Promise<Page<TheaterView>> {
    return this.theaters.list(query.props);
  }
}
