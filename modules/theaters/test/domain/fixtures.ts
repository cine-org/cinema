import { Slug } from '@repo/common';
import {
  Room,
  RoomLayout,
  SeatType,
  Theater,
  type RoomLayoutStatus,
  type RoomStatus,
  type TheaterStatus,
} from '../../src/domain';

export function theaterWith(status: TheaterStatus): Theater {
  return Theater.restore({
    id: crypto.randomUUID(),
    name: 'Cinema One',
    slug: Slug.create('cinema-one'),
    streetAddress: '1 Main Street',
    ward: 'Ward 1',
    province: 'Ho Chi Minh',
    phoneNumber: null,
    status,
  });
}

export function roomWith(status: RoomStatus, theater = theaterWith('ACTIVE')): Room {
  return Room.restore({
    id: crypto.randomUUID(),
    theaterId: theater.id,
    code: 'R01',
    name: 'Room 1',
    status,
  });
}

export function layoutWith(
  status: RoomLayoutStatus,
  {
    roomId = crypto.randomUUID(),
    gridRows = 10,
    gridCols = 10,
  }: { roomId?: string; gridRows?: number; gridCols?: number } = {},
): RoomLayout {
  return RoomLayout.restore({
    id: crypto.randomUUID(),
    roomId,
    version: 1,
    gridRows,
    gridCols,
    status,
    publishedAt: null,
    updatedAt: null,
  });
}

export const STANDARD = SeatType.restore({
  code: 'STANDARD',
  name: 'Standard',
  maxOccupancy: 1,
  width: 1,
});
export const COUPLE = SeatType.restore({
  code: 'COUPLE',
  name: 'Couple',
  maxOccupancy: 2,
  width: 2,
});
