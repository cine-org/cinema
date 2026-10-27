import { ApiProperty } from '@nestjs/swagger';
import { ROLE_SCOPE } from '@repo/iam';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

const SCOPES = [ROLE_SCOPE.GLOBAL, ROLE_SCOPE.CLUSTER, ROLE_SCOPE.THEATER];

export class AdminCreateRoleRequestDto {
  @ApiProperty({
    pattern: '^[A-Z][A-Z0-9_]{1,39}$',
    example: 'NIGHT_SUPERVISOR',
    description: 'Never changes; must not be a system role key.',
  })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]{1,39}$/, { message: 'key must be upper snake case' })
  readonly key!: string;

  @ApiProperty({ maxLength: 60, example: 'Night supervisor' })
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 60)
  readonly name!: string;

  @ApiProperty({ enum: SCOPES, isArray: true, description: 'Where the role may be granted.' })
  @IsArray()
  @ArrayMinSize(1)
  @IsIn(SCOPES, { each: true })
  readonly scopes!: (typeof SCOPES)[number][];

  @ApiProperty({
    type: [String],
    maxItems: 100,
    example: ['theaters:read'],
    description: 'To copy a role, pass its permissions.',
  })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  readonly permissions!: string[];
}
