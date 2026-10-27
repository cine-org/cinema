import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ROLE_SCOPE } from '@repo/iam';
import { Transform } from 'class-transformer';
import { IsEmail, IsIn, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

const SCOPES = [ROLE_SCOPE.GLOBAL, ROLE_SCOPE.CLUSTER, ROLE_SCOPE.THEATER];

export class AdminInviteUserRequestDto {
  @ApiProperty({ format: 'email', maxLength: 254 })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsEmail()
  @MaxLength(254)
  readonly email!: string;

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

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly fullName?: string;
}
