import { Injectable } from '@nestjs/common';
import { IamReadRepository } from '../ports';

export class ListPermissionsQuery {}

// The keys a role may be given: deprecated ones are left out.
@Injectable()
export class ListPermissionsHandler {
  constructor(private readonly iam: IamReadRepository) {}

  async execute(_query: ListPermissionsQuery): Promise<string[]> {
    return this.iam.listPermissions();
  }
}
