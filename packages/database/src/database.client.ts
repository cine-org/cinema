import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';

export type DatabaseClientOptions = {
  readonly url: string;
  readonly maxConnections?: number;
  readonly idleTimeoutMs?: number;
  readonly connectionTimeoutMs?: number;
};

abstract class BaseDatabaseClient extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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

// Primary, role cinema_rw. Only write repositories inject this.
export class DatabaseWriteClient extends BaseDatabaseClient {}

// Read path, role cinema_ro: a write through it fails with permission denied.
export class DatabaseReadClient extends BaseDatabaseClient {}
