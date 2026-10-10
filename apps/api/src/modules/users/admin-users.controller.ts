import { Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from '@/common/responses';
import { AdminApi } from '@/common/surface';
import { AdminUserResponseDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@AdminApi('users')
export class AdminUsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  @ApiSuccess(AdminUserResponseDto, { description: 'A single user.' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<AdminUserResponseDto> {
    return AdminUserResponseDto.from(await this.users.findById(id));
  }
}
