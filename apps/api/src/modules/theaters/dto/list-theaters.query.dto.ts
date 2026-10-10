import { ApiPropertyOptional } from '@nestjs/swagger';
import { THEATER_SORT_FIELDS, type TheaterSortField } from '@repo/theaters';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PageQueryDto, sortValues, type SortParam } from '@/common/requests';

const SORTS = sortValues(THEATER_SORT_FIELDS);

// No status filter: customers only ever see open theaters.
export class ListTheatersQueryDto extends PageQueryDto {
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

  @ApiPropertyOptional({ enum: SORTS, default: 'name:asc' })
  @IsOptional()
  @IsIn(SORTS)
  readonly sort: SortParam<TheaterSortField> = 'name:asc';
}
