import { ApiProperty } from '@nestjs/swagger';

// Accepted OTP issuance details. The client keeps verificationId for verify and resend.
export class VerificationAcceptedResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly verificationId!: string;

  @ApiProperty({ example: 600, description: 'Lifetime of the emailed code.' })
  readonly expiresInSeconds!: number;

  @ApiProperty({ example: 60, description: 'Wait before requesting another code.' })
  readonly resendAfterSeconds!: number;
}
