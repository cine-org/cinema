import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from './generated/prisma/client';
import type { PrismaClient as PrismaClientInstance } from './generated/prisma/client';

export type CreateDatabaseClientOptions = {
  url: string;
};

export type DatabaseClient = PrismaClientInstance;

export const createDatabaseClient = ({ url }: CreateDatabaseClientOptions): DatabaseClient => {
  const adapter = new PrismaPg({
    connectionString: url,
  });

  return new PrismaClient({
    adapter,
  });
};
