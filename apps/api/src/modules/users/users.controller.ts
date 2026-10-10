import { Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from '@/common/responses';
import { AdminApi } from '@/common/surface';
import { UserResponseDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@AdminApi('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get(':id')
  @ApiSuccess(UserResponseDto, { description: 'A single user.' })
  async findById(@Param('id', ParseUUIDPipe) id: string): Promise<UserResponseDto> {
    return UserResponseDto.from(await this.users.findById(id));
  }
}
