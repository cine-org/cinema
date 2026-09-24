import { Injectable } from '@nestjs/common';
import { DatabaseWriteClient, PRISMA_ERROR_CODE, throwIfPrismaError } from '@repo/database';
import { EmailAlreadyExistsException, type Account } from '../../domain';
import type { AccountWriteRepository } from '../../app';
import { PrismaAccountMapper } from './prisma-account.mapper';

@Injectable()
export class PrismaAccountWriteRepository implements AccountWriteRepository {
  constructor(private readonly db: DatabaseWriteClient) {}

  async save(account: Account): Promise<void> {
    try {
      await this.db.user.create({ data: PrismaAccountMapper.toCreateInput(account) });
    } catch (error) {
      // Two registrations in parallel both pass existsByEmail; the unique index is what decides.
      throwIfPrismaError(error, {
        [PRISMA_ERROR_CODE.UNIQUE_CONSTRAINT_FAILED]: () =>
          new EmailAlreadyExistsException({ cause: error }),
      });

      throw error;
    }
  }
}
