import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, Length, Matches } from 'class-validator';

export class ResetPasswordRequestDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  readonly resetId!: string;

  // A string, not a number: leading zeros are part of the code.
  @ApiProperty({ pattern: '^\\d{6}$', example: '012345' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  readonly otp!: string;

  // Same rule as registration.
  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @Length(8, 128)
  readonly newPassword!: string;
}
