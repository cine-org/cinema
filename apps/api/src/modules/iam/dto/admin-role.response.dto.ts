import { ApiProperty } from '@nestjs/swagger';
import { ROLE_SCOPE, type RoleScope, type RoleView } from '@repo/iam';

export class AdminRoleResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ example: 'THEATER_MANAGER' })
  readonly key!: string;

  @ApiProperty({ example: 'Theater manager' })
  readonly name!: string;

  @ApiProperty({
    enum: Object.values(ROLE_SCOPE),
    isArray: true,
    description: 'Where the role may be granted.',
  })
  readonly scopes!: RoleScope[];

  @ApiProperty({ description: 'Built in.' })
  readonly isSystem!: boolean;

  @ApiProperty({ description: 'Holds every permission; its permissions cannot be edited.' })
  readonly isLocked!: boolean;

  @ApiProperty({ type: [String], example: ['theaters:read', 'rooms:create'] })
  readonly permissions!: string[];

  @ApiProperty({ description: 'Accounts holding it now.', example: 6 })
  readonly users!: number;

  static from(role: RoleView): AdminRoleResponseDto {
    return {
      id: role.id,
      key: role.key,
      name: role.name,
      scopes: [...role.scopes],
      isSystem: role.isSystem,
      isLocked: role.isLocked,
      permissions: role.permissions,
      users: role.users,
    };
  }
}
