import { ApiProperty } from '@nestjs/swagger';
import { THEATER_STATUS, type TheaterStatus, type TheaterView } from '@repo/theaters';

export class AdminTheaterResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty()
  readonly name!: string;

  @ApiProperty()
  readonly slug!: string;

  @ApiProperty()
  readonly streetAddress!: string;

  @ApiProperty()
  readonly ward!: string;

  @ApiProperty()
  readonly province!: string;

  @ApiProperty({ type: String, nullable: true, example: '+842812345678' })
  readonly phoneNumber!: string | null;

  @ApiProperty({ enum: Object.values(THEATER_STATUS) })
  readonly status!: TheaterStatus;

  @ApiProperty({ format: 'date-time' })
  readonly createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  readonly updatedAt!: string;

  static from(theater: TheaterView): AdminTheaterResponseDto {
    return {
      id: theater.id,
      name: theater.name,
      slug: theater.slug,
      streetAddress: theater.streetAddress,
      ward: theater.ward,
      province: theater.province,
      phoneNumber: theater.phoneNumber,
      status: theater.status,
      createdAt: theater.createdAt.toISOString(),
      updatedAt: theater.updatedAt.toISOString(),
    };
  }
}
