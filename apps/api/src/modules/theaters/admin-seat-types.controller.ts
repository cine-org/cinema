import { Body, Delete, Get, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CodeResponseDto } from '@/common/dto';
import { ApiSuccess } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import {
  AdminCreateSeatTypeRequestDto,
  AdminSeatTypeResponseDto,
  AdminUpdateSeatTypeRequestDto,
} from './dto';
import { SeatTypesService } from './seat-types.service';

@ApiTags('seat-types')
@AdminApi('seat-types')
export class AdminSeatTypesController {
  constructor(private readonly seatTypes: SeatTypesService) {}

  @Post()
  @RequirePermission('seat-types:create')
  @ApiSuccess(CodeResponseDto, {
    status: HttpStatus.CREATED,
    description: 'Seat type created.',
  })
  async create(@Body() body: AdminCreateSeatTypeRequestDto): Promise<CodeResponseDto> {
    const { code, ...details } = body;
    return this.seatTypes.create({ code, details });
  }

  @Get()
  @RequirePermission('seat-types:read', 'any-scope')
  @ApiSuccess([AdminSeatTypeResponseDto], { description: 'Every seat type, by code.' })
  async list(): Promise<AdminSeatTypeResponseDto[]> {
    const seatTypes = await this.seatTypes.list();
    return seatTypes.map((seatType) => AdminSeatTypeResponseDto.from(seatType));
  }

  @Get(':code')
  @RequirePermission('seat-types:read', 'any-scope')
  @ApiSuccess(AdminSeatTypeResponseDto, { description: 'A single seat type.' })
  async findByCode(@Param('code') code: string): Promise<AdminSeatTypeResponseDto> {
    return AdminSeatTypeResponseDto.from(await this.seatTypes.findByCode(code));
  }

  @Patch(':code')
  @RequirePermission('seat-types:update')
  @ApiSuccess(CodeResponseDto, { description: 'Seat type updated.' })
  async update(
    @Param('code') code: string,
    @Body() body: AdminUpdateSeatTypeRequestDto,
  ): Promise<CodeResponseDto> {
    return this.seatTypes.update({ code, details: body });
  }

  @Delete(':code')
  @RequirePermission('seat-types:delete')
  @ApiSuccess(CodeResponseDto, { description: 'Unused seat type deleted.' })
  async delete(@Param('code') code: string): Promise<CodeResponseDto> {
    return this.seatTypes.delete(code);
  }
}
