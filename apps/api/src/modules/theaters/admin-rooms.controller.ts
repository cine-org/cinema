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
import { IdResponseDto } from '@/common/dto';
import { ApiSuccess } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import {
  AdminCreateRoomRequestDto,
  AdminListRoomsQueryDto,
  AdminRoomResponseDto,
  AdminUpdateRoomRequestDto,
} from './dto';
import { RoomsService } from './rooms.service';

// Created and listed under a theater; addressed by its own id afterwards.
@ApiTags('rooms')
@AdminApi()
export class AdminRoomsController {
  constructor(private readonly rooms: RoomsService) {}

  @Post('theaters/:theaterId/rooms')
  @RequirePermission('rooms:create', { theater: 'theaterId' })
  @ApiSuccess(IdResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Room created as a draft.',
  })
  async create(
    @Param('theaterId', ParseUUIDPipe) theaterId: string,
    @Body() body: AdminCreateRoomRequestDto,
  ): Promise<IdResponseDto> {
    return this.rooms.create({ theaterId, details: body });
  }

  @Get('theaters/:theaterId/rooms')
  @RequirePermission('rooms:read', { theater: 'theaterId' })
  @ApiSuccess([AdminRoomResponseDto], { description: 'Rooms of a theater, by code.' })
  async list(
    @Param('theaterId', ParseUUIDPipe) theaterId: string,
    @Query() query: AdminListRoomsQueryDto,
  ): Promise<AdminRoomResponseDto[]> {
    const rooms = await this.rooms.list({ theaterId, status: query.status });
    return rooms.map((room) => AdminRoomResponseDto.from(room));
  }

  @Get('rooms/:id')
  @RequirePermission('rooms:read', { room: 'id' })
  @ApiSuccess(AdminRoomResponseDto, { description: 'A single room.' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<AdminRoomResponseDto> {
    return AdminRoomResponseDto.from(await this.rooms.findById(id));
  }

  @Patch('rooms/:id')
  @RequirePermission('rooms:update', { room: 'id' })
  @ApiSuccess(IdResponseDto, { description: 'Room updated.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: AdminUpdateRoomRequestDto,
  ): Promise<IdResponseDto> {
    return this.rooms.update({ roomId: id, details: body });
  }

  @Post('rooms/:id/activate')
  @RequirePermission('rooms:activate', { room: 'id' })
  @ApiSuccess(IdResponseDto, { description: 'Room activated; needs a published layout.' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.rooms.activate(id);
  }

  @Post('rooms/:id/deactivate')
  @RequirePermission('rooms:deactivate', { room: 'id' })
  @ApiSuccess(IdResponseDto, { description: 'Room deactivated.' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.rooms.deactivate(id);
  }

  @Post('rooms/:id/close')
  @RequirePermission('rooms:close', { room: 'id' })
  @ApiSuccess(IdResponseDto, { description: 'Room closed for good.' })
  async close(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.rooms.close(id);
  }

  @Delete('rooms/:id')
  @RequirePermission('rooms:delete', { room: 'id' })
  @ApiSuccess(IdResponseDto, { description: 'Draft room deleted.' })
  async delete(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.rooms.delete(id);
  }
}
