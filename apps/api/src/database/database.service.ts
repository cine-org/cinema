import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { createDatabaseClient, type DatabaseClient } from '@repo/database';
import { ConfigService } from '@/config';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  readonly client: DatabaseClient;

  constructor(configService: ConfigService) {
    this.client = createDatabaseClient({
      url: configService.db.url,
    });
  }

  async onModuleInit() {
    await this.client.$connect();
  }

  async onModuleDestroy() {
    await this.client.$disconnect();
  }
}
