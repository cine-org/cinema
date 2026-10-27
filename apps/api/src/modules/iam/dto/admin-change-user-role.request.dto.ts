import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ROLE_SCOPE } from '@repo/iam';
import { IsIn, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const SCOPES = [ROLE_SCOPE.GLOBAL, ROLE_SCOPE.CLUSTER, ROLE_SCOPE.THEATER];

export class AdminChangeUserRoleRequestDto {
  @ApiProperty({ example: 'BOX_OFFICE', description: 'Key of an internal role.' })
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{1,39}$/, { message: 'role must be a role key' })
  readonly role!: string;

  @ApiProperty({ enum: SCOPES, description: 'One of the scopes the role allows.' })
  @IsIn(SCOPES)
  readonly scope!: (typeof SCOPES)[number];

  @ApiPropertyOptional({ format: 'uuid', description: 'Required for CLUSTER, absent otherwise.' })
  @IsOptional()
  @IsUUID()
  readonly clusterId?: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Required for THEATER, absent otherwise.' })
  @IsOptional()
  @IsUUID()
  readonly theaterId?: string;
}
