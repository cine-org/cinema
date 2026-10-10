import { ApiProperty } from '@nestjs/swagger';

// For resources keyed by a code instead of a uuid (catalogs such as seat types).
export class CodeResponseDto {
  @ApiProperty({ example: 'COUPLE' })
  readonly code!: string;
}
