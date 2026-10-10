import { Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from '@/common/responses';
import { UserApi } from '@/common/surface';
import { SeatTypeResponseDto } from './dto';
import { SeatTypesService } from './seat-types.service';

@ApiTags('seat-types')
@UserApi('seat-types')
export class SeatTypesController {
  constructor(private readonly seatTypes: SeatTypesService) {}

  @Get()
  @ApiSuccess([SeatTypeResponseDto], { description: 'Every seat type, by code.' })
  async list(): Promise<SeatTypeResponseDto[]> {
    const seatTypes = await this.seatTypes.list();
    return seatTypes.map((seatType) => SeatTypeResponseDto.from(seatType));
  }
}
