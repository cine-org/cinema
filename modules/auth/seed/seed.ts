// Dev/test data only, never run against prod. Idempotent, so `pnpm db:seed` can run any time.
import { DatabaseReadClient, DatabaseWriteClient } from '@repo/database';
import { RegisterCommand, RegisterHandler } from '../src/app';
import {
  Argon2PasswordHasher,
  PrismaAccountReadRepository,
  PrismaAccountWriteRepository,
} from '../src/infra';

const ACCOUNTS = [{ email: 'admin@cinema.local', password: 'admin12345', fullName: 'Admin' }];

// Goes through RegisterHandler so seeded accounts get normalized emails and real argon2 hashes.
async function seed(url: string): Promise<void> {
  // Seeding writes, so both sides use the same owner URL.
  const reader = new PrismaAccountReadRepository(new DatabaseReadClient({ url }));
  const writer = new PrismaAccountWriteRepository(new DatabaseWriteClient({ url }));
  const register = new RegisterHandler(reader, writer, new Argon2PasswordHasher());

  for (const account of ACCOUNTS) {
    if (await reader.existsByEmail(account.email)) continue;
    await register.execute(new RegisterCommand(account));
    console.log(`seeded account ${account.email}`);
  }
}

const url = process.env.DATABASE_URL;

if (!url) {
  console.error('DATABASE_URL is required to seed; run `pnpm db:seed` from the root');
  process.exit(1);
}

seed(url)
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
