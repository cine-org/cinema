import { createDatabaseClient } from '../src/client';
import { seedUsers } from './seeds/users.seed';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const db = createDatabaseClient({
  url: databaseUrl,
});

async function main() {
  await seedUsers(db);
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
