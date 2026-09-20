import { Controller, Get, ServiceUnavailableException, VERSION_NEUTRAL } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import { DatabaseClient } from '@repo/database';
import { Public } from '@/common/auth';

export class HealthResponseDto {
  @ApiProperty({
    example: 'ok',
  })
  readonly status!: 'ok';
}

@ApiTags('health')
@Public()
@Controller({
  path: 'health',
  version: VERSION_NEUTRAL,
})
export class HealthController {
  constructor(private readonly database: DatabaseClient) {}

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

  @Get('live')
  @ApiOkResponse({ type: HealthResponseDto, description: 'Process liveness status.' })
  live(): HealthResponseDto {
    return { status: 'ok' };
  }

  @Get('ready')
  @ApiOkResponse({ type: HealthResponseDto, description: 'API and PostgreSQL readiness status.' })
  async ready(): Promise<HealthResponseDto> {
    try {
      await this.database.$queryRaw`SELECT 1`;
      return { status: 'ok' };
    } catch {
      throw new ServiceUnavailableException({ status: 'unavailable', dependency: 'postgresql' });
    }
  }
}
