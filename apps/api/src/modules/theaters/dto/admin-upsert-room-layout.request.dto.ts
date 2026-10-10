import { ApiProperty } from '@nestjs/swagger';
import { MAX_GRID_COLS, MAX_GRID_ROWS, SEAT_TYPE_CODE_PATTERN } from '@repo/theaters';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

// Every cell holding a seat is the hard cap; the domain checks overlaps.
const MAX_SEATS = MAX_GRID_ROWS * MAX_GRID_COLS;

export class AdminSeatCellDto {
  @ApiProperty({
    minimum: 0,
    maximum: MAX_GRID_COLS - 1,
    description: 'Left grid cell of the seat.',
  })
  @IsInt()
  @Min(0)
  @Max(MAX_GRID_COLS - 1)
  readonly x!: number;

  @ApiProperty({ minimum: 0, maximum: MAX_GRID_ROWS - 1 })
  @IsInt()
  @Min(0)
  @Max(MAX_GRID_ROWS - 1)
  readonly y!: number;

  @ApiProperty({ pattern: SEAT_TYPE_CODE_PATTERN.source, example: 'STANDARD' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(SEAT_TYPE_CODE_PATTERN)
  readonly seatTypeCode!: string;
}

// The whole seat map: replaces every seat of the draft; labels are derived on save.
export class AdminUpsertRoomLayoutRequestDto {
  @ApiProperty({ minimum: 1, maximum: MAX_GRID_ROWS })
  @IsInt()
  @Min(1)
  @Max(MAX_GRID_ROWS)
  readonly gridRows!: number;

  @ApiProperty({ minimum: 1, maximum: MAX_GRID_COLS })
  @IsInt()
  @Min(1)
  @Max(MAX_GRID_COLS)
  readonly gridCols!: number;

  @ApiProperty({ type: [AdminSeatCellDto], maxItems: MAX_SEATS })
  @IsArray()
  @ArrayMaxSize(MAX_SEATS)
  @ValidateNested({ each: true })
  @Type(() => AdminSeatCellDto)
  readonly seats!: AdminSeatCellDto[];
}
