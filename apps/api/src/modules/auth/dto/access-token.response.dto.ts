import { ApiProperty } from '@nestjs/swagger';

// The refresh token is never in the body: it is set as an HttpOnly cookie.
export class AccessTokenResponseDto {
  @ApiProperty({ description: 'Send as `Authorization: Bearer <accessToken>`.' })
  readonly accessToken!: string;

  @ApiProperty({ enum: ['Bearer'] })
  readonly tokenType!: 'Bearer';

  @ApiProperty({ format: 'date-time', description: 'Refresh before this.' })
  readonly accessTokenExpiresAt!: string;
}
