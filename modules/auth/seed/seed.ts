// Dev/test data only, never run against prod. Idempotent, so `pnpm db:seed` can run any time.
import { Email } from '@repo/common';
import { DatabaseWriteClient } from '@repo/database';
import { Account } from '../src/domain';
import { Argon2PasswordHasher } from '../src/infra';

const ACCOUNTS = [{ email: 'admin@cinema.local', password: 'admin12345', fullName: 'Admin' }];

// Seeded accounts are already verified: no code, no Redis, no mail. Email and password go through
// the same normalization and Argon2 hashing as registration.
async function seed(url: string): Promise<void> {
  const db = new DatabaseWriteClient({ url });
  const hasher = new Argon2PasswordHasher();

  for (const input of ACCOUNTS) {
    const email = Email.create(input.email);
    if (await db.user.findUnique({ where: { email: email.value }, select: { id: true } })) continue;

    await db.user.create({
      data: {
        id: Account.newId(),
        email: email.value,
        passwordHash: await hasher.hash(input.password),
        fullName: input.fullName,
        isEmailVerified: true,
      },
    });
    console.log(`seeded account ${email.value}`);
  }

  await db.$disconnect();
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
