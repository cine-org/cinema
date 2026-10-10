import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  THEATER_SORT_FIELDS,
  THEATER_STATUS,
  type TheaterSortField,
  type TheaterStatus,
} from '@repo/theaters';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto, sortValues, type SortParam } from '@/common/requests';

const STATUSES = Object.values(THEATER_STATUS);
const SORTS = sortValues(THEATER_SORT_FIELDS);

export class AdminListTheatersQueryDto extends PageQueryDto {
  @ApiPropertyOptional({ enum: STATUSES })
  @IsOptional()
  @IsIn(STATUSES)
  readonly status?: TheaterStatus;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly province?: string;

  @ApiPropertyOptional({ maxLength: 100, description: 'Searches the theater name.' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly q?: string;

  @ApiPropertyOptional({ enum: SORTS, default: 'createdAt:desc' })
  @IsOptional()
  @IsIn(SORTS)
  readonly sort: SortParam<TheaterSortField> = 'createdAt:desc';
}
