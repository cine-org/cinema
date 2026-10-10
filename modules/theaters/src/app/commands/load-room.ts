import {
  RoomNotFoundException,
  TheaterNotFoundException,
  type Room,
  type Theater,
} from '../../domain';
import type { RoomWriteRepository, TheaterWriteRepository } from '../port';

// Room rules always check the theater too, so commands load both.
export async function loadRoom(
  rooms: RoomWriteRepository,
  theaters: TheaterWriteRepository,
  roomId: string,
): Promise<{ room: Room; theater: Theater }> {
  const room = await rooms.findById(roomId);

  if (!room) {
    throw new RoomNotFoundException();
  }

  const theater = await theaters.findById(room.theaterId);

  if (!theater) {
    throw new TheaterNotFoundException();
  }

  return { room, theater };
}
