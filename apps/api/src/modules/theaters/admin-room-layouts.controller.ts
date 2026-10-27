import { Body, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdResponseDto } from '@/common/dto';
import { ApiSuccess } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import {
  AdminRoomLayoutResponseDto,
  AdminRoomLayoutSummaryResponseDto,
  AdminUpsertRoomLayoutRequestDto,
} from './dto';
import { RoomLayoutsService } from './room-layouts.service';

// `draft` routes are declared before `:layoutId`, and ParseUUIDPipe keeps them apart.
@ApiTags('room-layouts')
@AdminApi('rooms/:roomId/layouts')
export class AdminRoomLayoutsController {
  constructor(private readonly layouts: RoomLayoutsService) {}

  @Put('draft')
  @RequirePermission('room-layouts:upsert-draft', { room: 'roomId' })
  @ApiSuccess(IdResponseDto, {
    description: 'Draft created or replaced; it is always the newest version.',
  })
  async upsertDraft(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() body: AdminUpsertRoomLayoutRequestDto,
  ): Promise<IdResponseDto> {
    const { gridRows, gridCols, seats } = body;
    return this.layouts.upsertDraft({ roomId, grid: { gridRows, gridCols }, seats });
  }

  @Get('draft')
  @RequirePermission('room-layouts:read', { room: 'roomId' })
  @ApiSuccess(AdminRoomLayoutResponseDto, { description: 'The current draft with its seats.' })
  async findDraft(
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<AdminRoomLayoutResponseDto> {
    return AdminRoomLayoutResponseDto.from(await this.layouts.findDraft(roomId));
  }

  @Post('draft/publish')
  @RequirePermission('room-layouts:publish', { room: 'roomId' })
  @ApiSuccess(IdResponseDto, {
    description: 'Draft published; the previous published version is retired.',
  })
  async publishDraft(@Param('roomId', ParseUUIDPipe) roomId: string): Promise<IdResponseDto> {
    return this.layouts.publishDraft(roomId);
  }

  @Get()
  @RequirePermission('room-layouts:read', { room: 'roomId' })
  @ApiSuccess([AdminRoomLayoutSummaryResponseDto], { description: 'Every version, newest first.' })
  async list(
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<AdminRoomLayoutSummaryResponseDto[]> {
    const layouts = await this.layouts.list(roomId);
    return layouts.map((layout) => AdminRoomLayoutSummaryResponseDto.from(layout));
  }

  @Get(':layoutId')
  @RequirePermission('room-layouts:read', { room: 'roomId' })
  @ApiSuccess(AdminRoomLayoutResponseDto, { description: 'One version with its seats.' })
  async findById(
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Param('layoutId', ParseUUIDPipe) layoutId: string,
  ): Promise<AdminRoomLayoutResponseDto> {
    return AdminRoomLayoutResponseDto.from(await this.layouts.findById({ roomId, layoutId }));
  }
}
