import { Injectable } from '@nestjs/common';
import type { AccessGrant } from '../../domain';
import { AccessGrantRepository } from '../ports';

export class GetAccessGrantQuery {
  constructor(readonly accountId: string) {}
}

// Read on every request rather than carried in the token, so a removed permission or role applies
// on the caller's next request.
@Injectable()
export class GetAccessGrantHandler {
  constructor(private readonly grants: AccessGrantRepository) {}

  async execute(query: GetAccessGrantQuery): Promise<AccessGrant | null> {
    return this.grants.findActive(query.accountId);
  }
}
