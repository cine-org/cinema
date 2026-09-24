import { Injectable } from '@nestjs/common';
import { DatabaseReadClient } from '@repo/database';
import type { AccountReadRepository } from '../../app';

@Injectable()
export class PrismaAccountReadRepository implements AccountReadRepository {
  constructor(private readonly db: DatabaseReadClient) {}

  async existsByEmail(email: string): Promise<boolean> {
    const found = await this.db.user.findFirst({ where: { email }, select: { id: true } });
    return found !== null;
  }
}
