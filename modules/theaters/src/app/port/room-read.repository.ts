import type { RoomStatus } from '../../domain';
import type { RoomView } from '../views';

// Views for queries only; commands go through the write repository.
export abstract class RoomReadRepository {
  abstract findById(id: string): Promise<RoomView | null>;
  abstract listByTheater(theaterId: string, status?: RoomStatus): Promise<RoomView[]>;
}
