import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ResendVerificationEmailRequestDto {
  @ApiProperty({ format: 'uuid', description: 'The latest verificationId the client holds.' })
  @IsUUID()
  readonly verificationId!: string;
}
