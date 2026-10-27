import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, MaxLength } from 'class-validator';

export class AdminReplaceRolePermissionsRequestDto {
  @ApiProperty({
    type: [String],
    maxItems: 100,
    example: ['theaters:read', 'rooms:create'],
    description: 'The whole new set; permissions left out are removed.',
  })
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  readonly permissions!: string[];
}
