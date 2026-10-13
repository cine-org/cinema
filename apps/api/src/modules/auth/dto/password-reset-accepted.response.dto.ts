import { ApiProperty } from '@nestjs/swagger';

// Same shape whether or not the email has an account. The client keeps resetId for reset-password.
export class PasswordResetAcceptedResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly resetId!: string;

  @ApiProperty({ example: 600, description: 'Lifetime of the emailed code.' })
  readonly expiresInSeconds!: number;

  @ApiProperty({ example: 60, description: 'Wait before requesting another code.' })
  readonly resendAfterSeconds!: number;
}
