import { Body, HttpStatus, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { AuthenticatedAccount } from '@repo/auth';
import { RateLimit } from '@/common/rate-limit';
import { ApiSuccess } from '@/common/responses';
import { AdminApi, RequirePermission } from '@/common/surface';
import { AuthService } from './auth.service';
import { CurrentAuth } from './bearer-auth.decorator';
import { AdminInvitationSentResponseDto, AdminInviteUserRequestDto } from './dto';

// Internal accounts only come by invitation, from whoever may grant roles.
@ApiTags('admin-users')
@AdminApi('users')
export class AdminUserInvitationsController {
  constructor(private readonly auth: AuthService) {}

  @Post('invitations')
  @RequirePermission('roles:assign')
  @RateLimit({ key: 'admin-users:invite', capacity: 20, refillIntervalMs: 6_000 })
  @ApiSuccess(AdminInvitationSentResponseDto, {
    status: HttpStatus.ACCEPTED,
    description:
      'Account created and invitation emailed; inviting a pending account again sends a new code.',
  })
  async invite(
    @CurrentAuth() auth: AuthenticatedAccount,
    @Body() body: AdminInviteUserRequestDto,
  ): Promise<AdminInvitationSentResponseDto> {
    return this.auth.inviteInternalAccount({
      actorId: auth.accountId,
      email: body.email,
      roleKey: body.role,
      place: {
        scope: body.scope,
        clusterId: body.clusterId ?? null,
        theaterId: body.theaterId ?? null,
      },
      fullName: body.fullName,
    });
  }
}
