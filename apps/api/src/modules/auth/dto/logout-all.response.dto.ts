import { ApiProperty } from '@nestjs/swagger';

export class LogoutAllResponseDto {
  @ApiProperty({ description: 'Sessions revoked, the current one included.' })
  readonly revokedSessions!: number;
}
