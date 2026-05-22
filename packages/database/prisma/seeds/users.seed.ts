import type { DatabaseClient } from '../../src/client';

export const seedUsers = async (db: DatabaseClient) => {
  await db.user.upsert({
    where: {
      username: 'admin',
    },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@cinema.local',
      isEmailVerified: true,
      passwordHash: 'dev-only-password-hash',
      fullName: 'Admin',
    },
  });
};
