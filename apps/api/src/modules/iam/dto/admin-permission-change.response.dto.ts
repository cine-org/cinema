import { ApiProperty } from '@nestjs/swagger';
import type { PermissionChange } from '@repo/iam';

export class AdminPermissionChangeResponseDto {
  @ApiProperty({ type: [String], example: ['rooms:create'] })
  readonly added!: string[];

  @ApiProperty({ type: [String], example: [] })
  readonly removed!: string[];

  static from(change: PermissionChange): AdminPermissionChangeResponseDto {
    return { added: change.added, removed: change.removed };
  }
}
