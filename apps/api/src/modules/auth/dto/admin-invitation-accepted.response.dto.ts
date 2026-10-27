import { ApiProperty } from '@nestjs/swagger';

export class AdminInvitationAcceptedResponseDto {
  @ApiProperty({ enum: [true], description: 'Sign in on /admin/auth/login with the new password.' })
  readonly accepted!: true;
}
