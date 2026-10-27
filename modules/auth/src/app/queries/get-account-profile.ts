import { Injectable } from '@nestjs/common';
import { InvalidAccessTokenException } from '../../domain';
import { AccountReadRepository, type AccountProfile } from '../ports';

export class GetAccountProfileQuery {
  constructor(readonly props: { readonly accountId: string }) {}
}

@Injectable()
export class GetAccountProfileHandler {
  constructor(private readonly accounts: AccountReadRepository) {}

  async execute(query: GetAccountProfileQuery): Promise<AccountProfile> {
    const profile = await this.accounts.findProfile(query.props.accountId);
    // Deleted between the session check and this read.
    if (!profile) throw new InvalidAccessTokenException();
    return profile;
  }
}
