import {
  Body,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Page } from '@repo/common';
import { IdResponseDto } from '@/common/dto';
import { toSortField } from '@/common/requests';
import { ApiPaginated, ApiSuccess } from '@/common/responses';
import { AdminApi } from '@/common/surface';
import {
  AdminCreateTheaterRequestDto,
  AdminListTheatersQueryDto,
  AdminTheaterResponseDto,
  AdminUpdateTheaterRequestDto,
} from './dto';
import { TheatersService } from './theaters.service';

@ApiTags('theaters')
@AdminApi('theaters')
export class AdminTheatersController {
  constructor(private readonly theaters: TheatersService) {}

  @Post()
  @ApiSuccess(IdResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Theater created as a draft.',
  })
  async create(@Body() body: AdminCreateTheaterRequestDto): Promise<IdResponseDto> {
    return this.theaters.create(body);
  }

  @Get()
  @ApiPaginated(AdminTheaterResponseDto, { description: 'Theaters, newest first.' })
  async list(@Query() query: AdminListTheatersQueryDto): Promise<Page<AdminTheaterResponseDto>> {
    const page = await this.theaters.list({
      filter: { status: query.status, province: query.province, q: query.q },
      sort: toSortField(query.sort),
      page: { page: query.page, limit: query.limit },
    });

    return { ...page, items: page.items.map((theater) => AdminTheaterResponseDto.from(theater)) };
  }

  @Get('slug/:slug')
  @ApiSuccess(AdminTheaterResponseDto, { description: 'A single theater by slug.' })
  async findBySlug(@Param('slug') slug: string): Promise<AdminTheaterResponseDto> {
    return AdminTheaterResponseDto.from(await this.theaters.findBySlug(slug));
  }

  @Get(':id')
  @ApiSuccess(AdminTheaterResponseDto, { description: 'A single theater.' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<AdminTheaterResponseDto> {
    return AdminTheaterResponseDto.from(await this.theaters.findById(id));
  }

  @Patch(':id')
  @ApiSuccess(IdResponseDto, { description: 'Theater updated.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminUpdateTheaterRequestDto,
  ): Promise<IdResponseDto> {
    return this.theaters.update({ theaterId: id, details: body });
  }

  @Post(':id/activate')
  @ApiSuccess(IdResponseDto, { description: 'Theater activated.' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.theaters.activate(id);
  }

  @Post(':id/deactivate')
  @ApiSuccess(IdResponseDto, { description: 'Theater deactivated.' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.theaters.deactivate(id);
  }

  @Post(':id/close')
  @ApiSuccess(IdResponseDto, { description: 'Theater closed for good.' })
  async close(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.theaters.close(id);
  }

  @Delete(':id')
  @ApiSuccess(IdResponseDto, { description: 'Draft theater deleted.' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.theaters.delete(id);
  }
}
