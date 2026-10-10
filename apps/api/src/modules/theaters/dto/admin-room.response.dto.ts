import { ApiProperty } from '@nestjs/swagger';
import { ROOM_STATUS, type RoomStatus, type RoomView } from '@repo/theaters';

export class AdminRoomResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ format: 'uuid' })
  readonly theaterId!: string;

  @ApiProperty({ example: 'R01' })
  readonly code!: string;

  @ApiProperty()
  readonly name!: string;

  @ApiProperty({ enum: Object.values(ROOM_STATUS) })
  readonly status!: RoomStatus;

  @ApiProperty({ type: String, format: 'uuid', nullable: true })
  readonly publishedLayoutId!: string | null;

  @ApiProperty({ description: 'Seats in the published layout; 0 when there is none.' })
  readonly seatCount!: number;

  @ApiProperty({ description: 'People the published layout holds (couple seats count 2).' })
  readonly capacity!: number;

  @ApiProperty({ description: 'Seats currently out of service.' })
  readonly inactiveSeats!: number;

  @ApiProperty({ format: 'date-time' })
  readonly createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  readonly updatedAt!: string;

  static from(room: RoomView): AdminRoomResponseDto {
    return {
      id: room.id,
      theaterId: room.theaterId,
      code: room.code,
      name: room.name,
      status: room.status,
      publishedLayoutId: room.publishedLayoutId,
      seatCount: room.seatCount,
      capacity: room.capacity,
      inactiveSeats: room.inactiveSeats,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  }
}
