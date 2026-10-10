import { Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Page } from '@repo/common';
import { THEATER_STATUS } from '@repo/theaters';
import { toSortField } from '@/common/requests';
import { ApiPaginated, ApiSuccess } from '@/common/responses';
import { UserApi } from '@/common/surface';
import { ListTheatersQueryDto, TheaterResponseDto } from './dto';
import { TheatersService } from './theaters.service';

@ApiTags('theaters')
@UserApi('theaters')
export class TheatersController {
  constructor(private readonly theaters: TheatersService) {}

  @Get()
  @ApiPaginated(TheaterResponseDto, { description: 'Open theaters.' })
  async list(@Query() query: ListTheatersQueryDto): Promise<Page<TheaterResponseDto>> {
    const page = await this.theaters.list({
      filter: { status: THEATER_STATUS.ACTIVE, province: query.province, q: query.q },
      sort: toSortField(query.sort),
      page: { page: query.page, limit: query.limit },
    });

    return { ...page, items: page.items.map((theater) => TheaterResponseDto.from(theater)) };
  }

  @Get('slug/:slug')
  @ApiSuccess(TheaterResponseDto, { description: 'A single open theater by slug.' })
  async findBySlug(@Param('slug') slug: string): Promise<TheaterResponseDto> {
    return TheaterResponseDto.from(await this.theaters.findOpenBySlug(slug));
  }
}
