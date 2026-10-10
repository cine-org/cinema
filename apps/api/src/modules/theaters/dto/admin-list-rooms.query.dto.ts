import { ApiPropertyOptional } from '@nestjs/swagger';
import { ROOM_STATUS, type RoomStatus } from '@repo/theaters';
import { IsIn, IsOptional } from 'class-validator';

const STATUSES = Object.values(ROOM_STATUS);

// No paging: a theater has a handful of rooms.
export class AdminListRoomsQueryDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  readonly status?: RoomStatus;
}
