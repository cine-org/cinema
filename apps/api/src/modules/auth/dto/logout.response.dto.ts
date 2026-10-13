import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponseDto {
  @ApiProperty({ enum: [true] })
  readonly loggedOut!: true;
}
