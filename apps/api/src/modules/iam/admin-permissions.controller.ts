import { Get } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiTags, getSchemaPath } from '@nestjs/swagger';
import { SuccessResponse } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import { IamService } from './iam.service';

// The catalog lives in code and is synced on startup; read only here.
@ApiTags('admin-roles')
@AdminApi('permissions')
export class AdminPermissionsController {
  constructor(private readonly iam: IamService) {}

  // Plain keys, the way the admin app groups them: ApiSuccess documents DTOs only.
  @Get()
  @RequirePermission('roles:read')
  @ApiExtraModels(SuccessResponse)
  @ApiOkResponse({
    description: 'Every permission a role can hold, as resource:action keys.',
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponse) },
        {
          properties: {
            data: { type: 'array', items: { type: 'string' }, example: ['theaters:read'] },
          },
        },
      ],
    },
  })
  async list(): Promise<string[]> {
    return this.iam.listPermissions();
  }
}
