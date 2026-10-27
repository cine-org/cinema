import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { Email } from '@repo/common';
import {
  AccountHasRoleException,
  assertGrantable,
  ClusterNotFoundException,
  RoleNotFoundException,
  TheaterUnavailableException,
  type GrantPlace,
} from '@repo/iam';
import {
  Account,
  ACCOUNT_INVITATION_POLICY,
  EMAIL_CODE_PURPOSE,
  EmailAlreadyExistsException,
} from '../../domain';
import {
  AccountWriteRepository,
  AuthMailer,
  EmailOtpProtector,
  PasswordHasher,
  type InvitationTarget,
} from '../ports';

export type InviteInternalAccountCommandProps = {
  readonly actorId: string;
  readonly email: string;
  readonly roleKey: string;
  readonly place: GrantPlace;
  readonly fullName?: string | null;
};

export class InviteInternalAccountCommand {
  constructor(readonly props: InviteInternalAccountCommandProps) {}
}

export type InvitationSent = {
  readonly accountId: string;
  readonly invitationId: string;
  readonly expiresInSeconds: number;
};

// Internal accounts only come this way; who may invite is the route's permission (roles:assign).
// The account is created at once, unverified and with a password nobody knows, so the email is
// taken; the invitee sets the password with the emailed code.
@Injectable()
export class InviteInternalAccountHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly hasher: PasswordHasher,
    private readonly otp: EmailOtpProtector,
    private readonly mailer: AuthMailer,
  ) {}

  async execute(command: InviteInternalAccountCommand): Promise<InvitationSent> {
    const { actorId, roleKey, place, fullName } = command.props;
    const email = Email.create(command.props.email);

    const role = await this.accounts.findRole(roleKey);
    if (!role) throw new RoleNotFoundException();
    assertGrantable(role, place);
    if (place.clusterId && !(await this.accounts.clusterExists(place.clusterId))) {
      throw new ClusterNotFoundException();
    }
    if (place.theaterId && !(await this.accounts.isOpenTheater(place.theaterId))) {
      throw new TheaterUnavailableException();
    }

    const now = new Date();
    const existing = await this.accounts.findInvitationTarget(email);
    if (existing) return this.reinvite(existing, email, roleKey, place, now);

    const id = Account.newId();
    const issued = this.otp.issue({
      accountId: id,
      email,
      purpose: EMAIL_CODE_PURPOSE.ACCOUNT_INVITATION,
      now,
    });
    await this.accounts.create(
      Account.invite({
        id,
        email,
        fullName,
        passwordHash: await this.hasher.hash(randomBytes(32).toString('base64')),
        invitation: issued.code,
      }),
      { roleKey, ...place, grantedById: actorId },
    );
    return this.sent(id, email, role.key, issued.code.id, issued.otp);
  }

  // Inviting the same pending account again, to the same role and place, sends a new code;
  // anything else is taken.
  private async reinvite(
    existing: InvitationTarget,
    email: Email,
    roleKey: string,
    place: GrantPlace,
    now: Date,
  ): Promise<InvitationSent> {
    const pending = !existing.isEmailVerified && existing.deletedAt === null;
    if (!pending || !existing.role) throw new EmailAlreadyExistsException();
    const { role } = existing;
    if (
      role.key !== roleKey ||
      role.scope !== place.scope ||
      role.clusterId !== place.clusterId ||
      role.theaterId !== place.theaterId
    ) {
      throw new AccountHasRoleException();
    }

    const issued = this.otp.issue({
      accountId: existing.id,
      email,
      purpose: EMAIL_CODE_PURPOSE.ACCOUNT_INVITATION,
      now,
    });
    const reinvited = await this.accounts.modify(existing.id, (account) =>
      account.reinvite(issued.code, now),
    );
    if (!reinvited) throw new EmailAlreadyExistsException();
    return this.sent(existing.id, email, roleKey, issued.code.id, issued.otp);
  }

  private sent(
    accountId: string,
    to: Email,
    roleName: string,
    invitationId: string,
    otp: string,
  ): InvitationSent {
    this.mailer.sendInvitation({
      to,
      otp,
      invitationId,
      roleName,
      expiresInHours: ACCOUNT_INVITATION_POLICY.otpTtlSeconds / 3600,
    });
    return {
      accountId,
      invitationId,
      expiresInSeconds: ACCOUNT_INVITATION_POLICY.otpTtlSeconds,
    };
  }
}
