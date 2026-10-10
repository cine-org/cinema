import { ApiProperty } from '@nestjs/swagger';
import type { SeatTypeView } from '@repo/theaters';

export class SeatTypeResponseDto {
  @ApiProperty({ example: 'COUPLE' })
  readonly code!: string;

  @ApiProperty({ example: 'Couple' })
  readonly name!: string;

  @ApiProperty({ example: 2 })
  readonly maxOccupancy!: number;

  @ApiProperty({ example: 2 })
  readonly width!: number;

  static from(seatType: SeatTypeView): SeatTypeResponseDto {
    return {
      code: seatType.code,
      name: seatType.name,
      maxOccupancy: seatType.maxOccupancy,
      width: seatType.width,
    };
  }
}
