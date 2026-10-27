import { ApiProperty } from '@nestjs/swagger';
import { ROLE_SCOPE, type EmployeeView, type RoleScope } from '@repo/iam';

class AdminEmployeeRoleDto {
  @ApiProperty({ example: 'BOX_OFFICE' })
  readonly key!: string;

  @ApiProperty({ example: 'Box office' })
  readonly name!: string;
}

// The admin app's Employee: a user with a role and where it applies.
export class AdminEmployeeResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ type: String, nullable: true })
  readonly fullName!: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'email' })
  readonly email!: string | null;

  @ApiProperty({ description: 'False until the invitation is accepted.' })
  readonly isEmailVerified!: boolean;

  @ApiProperty({ format: 'date-time' })
  readonly createdAt!: string;

  @ApiProperty({
    enum: ['active'],
    description: 'Suspending and banning come with the user module.',
  })
  readonly status!: 'active';

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  readonly deletedAt!: string | null;

  @ApiProperty({ type: AdminEmployeeRoleDto })
  readonly role!: AdminEmployeeRoleDto;

  @ApiProperty({ enum: [ROLE_SCOPE.GLOBAL, ROLE_SCOPE.CLUSTER, ROLE_SCOPE.THEATER] })
  readonly scope!: RoleScope;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Set for CLUSTER.' })
  readonly clusterId!: string | null;

  @ApiProperty({ type: String, format: 'uuid', nullable: true, description: 'Set for THEATER.' })
  readonly theaterId!: string | null;

  static from(employee: EmployeeView): AdminEmployeeResponseDto {
    return {
      id: employee.id,
      fullName: employee.fullName,
      email: employee.email,
      isEmailVerified: employee.isEmailVerified,
      createdAt: employee.createdAt.toISOString(),
      status: 'active',
      deletedAt: employee.deletedAt?.toISOString() ?? null,
      role: { key: employee.role.key, name: employee.role.name },
      scope: employee.scope,
      clusterId: employee.clusterId,
      theaterId: employee.theaterId,
    };
  }
}
