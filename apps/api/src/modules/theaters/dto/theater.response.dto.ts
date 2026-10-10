import { ApiProperty } from '@nestjs/swagger';
import type { TheaterView } from '@repo/theaters';

export class TheaterResponseDto {
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

  static from(theater: TheaterView): TheaterResponseDto {
    return {
      id: theater.id,
      name: theater.name,
      slug: theater.slug,
      streetAddress: theater.streetAddress,
      ward: theater.ward,
      province: theater.province,
      phoneNumber: theater.phoneNumber,
    };
  }
}
