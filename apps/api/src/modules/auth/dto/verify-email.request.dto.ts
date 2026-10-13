import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Matches } from 'class-validator';

export class VerifyEmailRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly verificationId!: string;

  // A string, not a number: leading zeros are part of the code.
  @ApiProperty({ pattern: '^\\d{6}$', example: '012345' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  readonly otp!: string;
}
