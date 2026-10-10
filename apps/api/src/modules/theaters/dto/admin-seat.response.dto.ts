import { ApiProperty } from '@nestjs/swagger';
import { SEAT_STATUS, type SeatStatus, type SeatView } from '@repo/theaters';

export class AdminSeatResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ example: 'A01' })
  readonly seatCode!: string;

  @ApiProperty({ example: 'STANDARD' })
  readonly seatTypeCode!: string;

  @ApiProperty()
  readonly x!: number;

  @ApiProperty()
  readonly y!: number;

  @ApiProperty({ example: 'A' })
  readonly rowLabel!: string;

  @ApiProperty({ example: 1 })
  readonly columnNumber!: number;

  @ApiProperty({ enum: Object.values(SEAT_STATUS) })
  readonly status!: SeatStatus;

  static from(seat: SeatView): AdminSeatResponseDto {
    return {
      id: seat.id,
      seatCode: seat.seatCode,
      seatTypeCode: seat.seatTypeCode,
      x: seat.x,
      y: seat.y,
      rowLabel: seat.rowLabel,
      columnNumber: seat.columnNumber,
      status: seat.status,
    };
  }
}
