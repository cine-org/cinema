import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';

export class ChangePasswordRequestDto {
  // No minimum beyond non-empty, as at login: older passwords may predate the current rule.
  @ApiProperty({ minLength: 1, maxLength: 128 })
  @IsString()
  @Length(1, 128)
  readonly currentPassword!: string;

  // Same rule as registration.
  @ApiProperty({ minLength: 8, maxLength: 128 })
  @IsString()
  @Length(8, 128)
  readonly newPassword!: string;
}
