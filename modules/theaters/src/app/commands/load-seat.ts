import {
  ROOM_LAYOUT_STATUS,
  RoomLayoutNotPublishedException,
  SeatNotFoundException,
  type Seat,
} from '../../domain';
import type {
  RoomLayoutWriteRepository,
  RoomWriteRepository,
  SeatWriteRepository,
  TheaterWriteRepository,
} from '../port';
import { loadRoom } from './load-room';

export type SeatRepositories = {
  readonly seats: SeatWriteRepository;
  readonly layouts: RoomLayoutWriteRepository;
  readonly rooms: RoomWriteRepository;
  readonly theaters: TheaterWriteRepository;
};

// Only seats of a published layout change status, and never in a closed room or theater.
export async function loadServiceableSeat(repos: SeatRepositories, seatId: string): Promise<Seat> {
  const seat = await repos.seats.findById(seatId);

  if (!seat) {
    throw new SeatNotFoundException();
  }

  const layout = await repos.layouts.findById(seat.layoutId);

  if (layout?.status !== ROOM_LAYOUT_STATUS.PUBLISHED) {
    throw new RoomLayoutNotPublishedException();
  }

  const { room, theater } = await loadRoom(repos.rooms, repos.theaters, layout.roomId);
  room.assertEditable(theater);

  return seat;
}
