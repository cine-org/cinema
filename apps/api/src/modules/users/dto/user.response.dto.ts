import { ApiProperty } from '@nestjs/swagger';
import type { UserView } from '@repo/users';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  readonly id!: string;

  @ApiProperty({ type: String, nullable: true })
  readonly email!: string | null;

  @ApiProperty()
  readonly isEmailVerified!: boolean;

  @ApiProperty({ type: String, nullable: true })
  readonly fullName!: string | null;

  @ApiProperty({ type: String, format: 'date', nullable: true })
  readonly dateOfBirth!: string | null;

  @ApiProperty({ format: 'date-time' })
  readonly createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  readonly updatedAt!: string;

  static from(user: UserView): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      fullName: user.fullName,
      dateOfBirth: user.dateOfBirth?.toISOString().slice(0, 10) ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
