import { ApiProperty } from '@nestjs/swagger';
import { MAX_SEAT_OCCUPANCY, MAX_SEAT_WIDTH, SEAT_TYPE_CODE_PATTERN } from '@repo/theaters';
import { Transform } from 'class-transformer';
import { IsInt, IsString, Length, Matches, Max, Min } from 'class-validator';

export class AdminCreateSeatTypeRequestDto {
  @ApiProperty({
    pattern: SEAT_TYPE_CODE_PATTERN.source,
    example: 'COUPLE',
    description: 'Primary key; stored uppercase and never changes.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(SEAT_TYPE_CODE_PATTERN)
  readonly code!: string;

  @ApiProperty({ maxLength: 50, example: 'Couple' })
  @IsString()
  @Length(1, 50)
  readonly name!: string;

  @ApiProperty({
    minimum: 1,
    maximum: MAX_SEAT_OCCUPANCY,
    example: 2,
    description: 'People one seat holds.',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_SEAT_OCCUPANCY)
  readonly maxOccupancy!: number;

  @ApiProperty({
    minimum: 1,
    maximum: MAX_SEAT_WIDTH,
    example: 2,
    description: 'Grid cells one seat spans.',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_SEAT_WIDTH)
  readonly width!: number;
}
