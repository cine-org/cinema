import { ApiProperty } from '@nestjs/swagger';
import { ROOM_CODE_PATTERN } from '@repo/theaters';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class AdminCreateRoomRequestDto {
  @ApiProperty({
    pattern: ROOM_CODE_PATTERN.source,
    example: 'R01',
    description: 'Unique within the theater; stored uppercase.',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @Matches(ROOM_CODE_PATTERN)
  readonly code!: string;

  @ApiProperty({ maxLength: 100, example: 'Phòng 1' })
  @IsString()
  @Length(1, 100)
  readonly name!: string;
}
