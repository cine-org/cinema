import { ApiProperty } from '@nestjs/swagger';

export class SessionResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ format: 'date-time', description: 'When the login happened.' })
  readonly createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  readonly lastRefreshedAt!: string;

  @ApiProperty({ type: String, nullable: true, description: 'As sent at login; informational.' })
  readonly userAgent!: string | null;

  @ApiProperty({ type: String, nullable: true, description: 'IP at login; informational.' })
  readonly ipAddress!: string | null;

  @ApiProperty({ description: 'The session of the access token making this request.' })
  readonly isCurrent!: boolean;
}
