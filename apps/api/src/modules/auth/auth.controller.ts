import { Body, Controller, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApiSuccess } from '@/common/responses';
import { RegisterRequestDto, RegisterResponseDto } from './dto';
import { AuthService } from './auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register')
  @ApiSuccess(RegisterResponseDto, { status: HttpStatus.CREATED, description: 'Account created.' })
  async register(@Body() body: RegisterRequestDto): Promise<RegisterResponseDto> {
    return this.auth.register(body);
  }
}
