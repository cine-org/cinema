import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { RawResponse } from '@/common/responses';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
  })
  readonly status!: 'ok';
}

@ApiTags('health')
@RawResponse()
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  @Get()
  @ApiOkResponse({
    type: HealthResponseDto,
    description: 'API health status.',
  })
  check(): HealthResponseDto {
    return {
      status: 'ok',
    };
  }
}
