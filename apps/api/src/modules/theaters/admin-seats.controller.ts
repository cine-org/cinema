import { Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { IdResponseDto } from '@/common/dto';
import { ApiSuccess } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import { SeatsService } from './seats.service';

// Marks seats of a published layout in or out of service; drafts are replaced on save.
@ApiTags('seats')
@AdminApi('seats')
export class AdminSeatsController {
  constructor(private readonly seats: SeatsService) {}

  @Post(':id/activate')
  @RequirePermission('seats:activate', { seat: 'id' })
  @ApiSuccess(IdResponseDto, { description: 'Seat back in service.' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.seats.activate(id);
  }

  @Post(':id/deactivate')
  @RequirePermission('seats:deactivate', { seat: 'id' })
  @ApiSuccess(IdResponseDto, { description: 'Seat out of service; it can no longer be booked.' })
  async deactivate(@Param('id', ParseUUIDPipe) id: string): Promise<IdResponseDto> {
    return this.seats.deactivate(id);
  }
}
