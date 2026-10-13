import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailResponseDto {
  @ApiProperty({ enum: [true] })
  readonly isEmailVerified!: true;
}
