import { DatabaseClient } from '../src/database.client';
import { seedIam } from './seeds/iam.seed';

const databaseUrl = process.env['DATABASE_URL'];

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to seed the database');
}

const db = new DatabaseClient({
  url: databaseUrl,
});

async function main() {
  await seedIam(db);
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
