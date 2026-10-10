import type { Room } from '../../domain';

export abstract class RoomWriteRepository {
  abstract findById(id: string): Promise<Room | null>;
  abstract create(room: Room): Promise<void>;
  abstract update(room: Room): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
