import type { Page } from '@repo/common';
import type { ListTheatersQueryProps } from '../queries';
import type { TheaterView } from '../views';

// Views for queries only; commands go through the write repository.
export abstract class TheaterReadRepository {
  abstract findById(id: string): Promise<TheaterView | null>;
  abstract findBySlug(slug: string): Promise<TheaterView | null>;
  abstract list(props: ListTheatersQueryProps): Promise<Page<TheaterView>>;
}
