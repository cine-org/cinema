import type { Theater } from '../../domain';

// Loads the entity a command mutates; slug and FK violations map to domain exceptions.
export abstract class TheaterWriteRepository {
  abstract findById(id: string): Promise<Theater | null>;
  abstract create(theater: Theater): Promise<void>;
  abstract update(theater: Theater): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
