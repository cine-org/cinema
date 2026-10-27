// Creates the first SUPER_ADMIN of an environment; every later internal account comes by invitation.
// Run once from a shell that has the api env, e.g. in the api pod:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='...' node dist/cli/create-admin.js
// Refuses when a SUPER_ADMIN already exists. The password is read from the environment rather than an
// argument so it stays out of the shell history.
import { NestFactory } from '@nestjs/core';
import { AppException } from '@repo/common';
import { CreateFirstAdminCommand, CreateFirstAdminHandler } from '@repo/auth';
import { AppModule } from '@/app.module';

const MIN_PASSWORD = 8;
const MAX_PASSWORD = 128;

async function main(): Promise<number> {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
    return 1;
  }
  if (password.length < MIN_PASSWORD || password.length > MAX_PASSWORD) {
    console.error(`ADMIN_PASSWORD must be ${MIN_PASSWORD} to ${MAX_PASSWORD} characters`);
    return 1;
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const { accountId } = await app
      .get(CreateFirstAdminHandler)
      .execute(
        new CreateFirstAdminCommand({ email, password, fullName: process.env.ADMIN_FULL_NAME }),
      );
    console.log(
      `Created SUPER_ADMIN ${email} (${accountId}). Sign in on /api/v1/admin/auth/login.`,
    );
    return 0;
  } catch (error) {
    if (error instanceof AppException) {
      console.error(`${error.code}: ${error.message}`);
      return 1;
    }
    throw error;
  } finally {
    await app.close();
  }
}

main().then(
  (code) => process.exit(code),
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
