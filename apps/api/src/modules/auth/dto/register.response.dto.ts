import { ApiProperty } from '@nestjs/swagger';

export class RegisterResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;
}
