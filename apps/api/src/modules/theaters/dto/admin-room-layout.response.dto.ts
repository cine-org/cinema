import { ApiProperty } from '@nestjs/swagger';
import {
  ROOM_LAYOUT_STATUS,
  type RoomLayoutStatus,
  type RoomLayoutSummaryView,
  type RoomLayoutView,
} from '@repo/theaters';
import { AdminSeatResponseDto } from './admin-seat.response.dto';

class AdminRoomLayoutBaseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ format: 'uuid' })
  readonly roomId!: string;

  @ApiProperty({ example: 3 })
  readonly version!: number;

  @ApiProperty({ enum: Object.values(ROOM_LAYOUT_STATUS) })
  readonly status!: RoomLayoutStatus;

  @ApiProperty()
  readonly gridRows!: number;

  @ApiProperty()
  readonly gridCols!: number;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  readonly publishedAt!: string | null;

  @ApiProperty({ format: 'date-time' })
  readonly createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  readonly updatedAt!: string;
}

function toBase(layout: Omit<RoomLayoutSummaryView, 'seatCount'>): AdminRoomLayoutBaseDto {
  return {
    id: layout.id,
    roomId: layout.roomId,
    version: layout.version,
    status: layout.status,
    gridRows: layout.gridRows,
    gridCols: layout.gridCols,
    publishedAt: layout.publishedAt?.toISOString() ?? null,
    createdAt: layout.createdAt.toISOString(),
    updatedAt: layout.updatedAt.toISOString(),
  };
}

// One version in the history list, without its seats.
export class AdminRoomLayoutSummaryResponseDto extends AdminRoomLayoutBaseDto {
  @ApiProperty()
  readonly seatCount!: number;

  static from(layout: RoomLayoutSummaryView): AdminRoomLayoutSummaryResponseDto {
    return { ...toBase(layout), seatCount: layout.seatCount };
  }
}

export class AdminRoomLayoutResponseDto extends AdminRoomLayoutBaseDto {
  @ApiProperty({ type: [AdminSeatResponseDto] })
  readonly seats!: AdminSeatResponseDto[];

  static from(layout: RoomLayoutView): AdminRoomLayoutResponseDto {
    return {
      ...toBase(layout),
      seats: layout.seats.map((seat) => AdminSeatResponseDto.from(seat)),
    };
  }
}
