import { ApiProperty } from '@nestjs/swagger';

// HTTP mirror of CommandResult: every command answers with the id it touched.
export class IdResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;
}
