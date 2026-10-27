import { Injectable } from '@nestjs/common';
import { Email } from '@repo/common';
import { ROLE_SCOPE, SYSTEM_ROLE } from '@repo/iam';
import {
  Account,
  EMAIL_CODE_PURPOSE,
  EMAIL_VERIFICATION_POLICY,
  EmailAlreadyExistsException,
} from '../../domain';
import {
  AccountWriteRepository,
  AuthMailer,
  EmailOtpProtector,
  EmailVerificationLimiter,
  PasswordHasher,
  type IssuedEmailCode,
} from '../ports';
import {
  decoyVerification,
  takeIssuanceOrThrow,
  verificationAccepted,
  type VerificationAccepted,
} from './verification-accepted';

const VERIFICATION = EMAIL_CODE_PURPOSE.EMAIL_VERIFICATION;

export type RegisterCommandProps = {
  readonly email: string;
  readonly password: string;
  readonly fullName?: string | null;
};

export class RegisterCommand {
  constructor(readonly props: RegisterCommandProps) {}
}

@Injectable()
export class RegisterHandler {
  constructor(
    private readonly accounts: AccountWriteRepository,
    private readonly hasher: PasswordHasher,
    private readonly otp: EmailOtpProtector,
    private readonly limiter: EmailVerificationLimiter,
    private readonly mailer: AuthMailer,
  ) {}

  async execute(command: RegisterCommand): Promise<VerificationAccepted> {
    const { password, fullName } = command.props;
    const email = Email.create(command.props.email);
    const existing = await this.accounts.findRegistrationByEmail(email);
    if (existing && existing.deletedAt === null && existing.isEmailVerified) {
      throw new EmailAlreadyExistsException();
    }

    await takeIssuanceOrThrow(this.limiter, email);
    const passwordHash = await this.hasher.hash(password);
    const now = new Date();

    if (!existing) {
      const id = Account.newId();
      const issued = this.otp.issue({ accountId: id, email, purpose: VERIFICATION, now });
      await this.accounts.create(
        Account.register({ id, email, passwordHash, fullName, verification: issued.code }),
        // Registration always makes a customer; internal accounts come by invitation.
        {
          roleKey: SYSTEM_ROLE.CUSTOMER,
          scope: ROLE_SCOPE.SELF,
          clusterId: null,
          theaterId: null,
          grantedById: null,
        },
      );
      return this.sent(email, issued);
    }

    const issued = this.otp.issue({ accountId: existing.id, email, purpose: VERIFICATION, now });
    const replaced = await this.accounts.modify(existing.id, (account) =>
      account.reRegister({ passwordHash, fullName }, issued.code, now),
    );
    // Verification may have completed since the early read; modify() decides under the lock.
    if (replaced === false) throw new EmailAlreadyExistsException();
    if (replaced === null) return decoyVerification();
    return this.sent(email, issued);
  }

  private sent(email: Email, issued: IssuedEmailCode): VerificationAccepted {
    this.mailer.sendVerificationCode({
      to: email,
      otp: issued.otp,
      verificationId: issued.code.id,
      expiresInMinutes: EMAIL_VERIFICATION_POLICY.otpTtlSeconds / 60,
    });
    return verificationAccepted(issued.code.id);
  }
}
