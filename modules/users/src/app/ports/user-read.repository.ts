import type { UserView } from '../views';

// Abstract class, not interface: it survives to runtime, so it is its own DI token.
export abstract class UserReadRepository {
  abstract findById(id: string): Promise<UserView | null>;
}
