import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';
import { PageQueryDto } from '@/common/requests';

// Customers are listed with the user module; only employees for now.
const TYPES = ['employee'] as const;

export class AdminListEmployeesQueryDto extends PageQueryDto {
  @ApiProperty({ enum: TYPES })
  @IsIn(TYPES)
  readonly type!: (typeof TYPES)[number];
}
