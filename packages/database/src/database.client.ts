import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export type DatabaseClientOptions = {
  readonly url: string;
  readonly maxConnections?: number;
  readonly idleTimeoutMs?: number;
  readonly connectionTimeoutMs?: number;
};

export class DatabaseClient extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(options: DatabaseClientOptions) {
    const adapter = new PrismaPg({
      connectionString: options.url,
      max: options.maxConnections,
      idleTimeoutMillis: options.idleTimeoutMs,
      connectionTimeoutMillis: options.connectionTimeoutMs,
    });

    super({ adapter });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}

export type CreateDatabaseClientOptions = DatabaseClientOptions;

export const createDatabaseClient = (options: CreateDatabaseClientOptions): DatabaseClient =>
  new DatabaseClient(options);
