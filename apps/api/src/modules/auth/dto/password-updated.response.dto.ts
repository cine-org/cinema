import { ApiProperty } from '@nestjs/swagger';

// Answer to reset-password and change-password: every session has ended, log in again.
export class PasswordUpdatedResponseDto {
  @ApiProperty({ enum: [true] })
  readonly passwordUpdated!: true;
}
