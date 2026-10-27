import { ApiProperty } from '@nestjs/swagger';

export class AdminInvitationSentResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly accountId!: string;

  @ApiProperty({ format: 'uuid', description: 'Sent with the code to accept the invitation.' })
  readonly invitationId!: string;

  @ApiProperty({ example: 259200 })
  readonly expiresInSeconds!: number;
}
