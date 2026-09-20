import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { describe, expect, it } from 'vitest';
import { DatabaseClient } from '../src/database.client';
import { seedIam } from '../prisma/seeds/iam.seed';

describe('auth and IAM migration', () => {
  it('preserves legacy identity fields and rejects the development password placeholder', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required');
    const schema = `migration_${randomUUID().replaceAll('-', '')}`;
    const client = new Client({ connectionString: databaseUrl });
    await client.connect();
    try {
      await client.query(`CREATE SCHEMA "${schema}"`);
      await client.query(`SET search_path TO "${schema}"`);
      await client.query(await migration('20260517144115_add_users'));
      await client.query(`
        INSERT INTO "User" (id, email, "isEmailVerified", "passwordHash", username, "fullName", "createdAt", "updatedAt")
        VALUES
          ('legacy-active', 'Active@Example.Test', true, '$argon2id$valid-for-migration', 'ActiveViewer', 'Active Viewer', NOW(), NOW()),
          ('legacy-pending', 'pending@example.test', false, 'dev-only-password-hash', 'PendingViewer', 'Pending Viewer', NOW(), NOW())
      `);
      await client.query(await migration('20260918000100_add_auth_and_iam'));

      const users = await client.query<{ id: string; username: string; status: string }>(
        'SELECT id, username, status::text FROM users ORDER BY id',
      );
      expect(users.rows).toEqual([
        { id: 'legacy-active', username: 'ActiveViewer', status: 'ACTIVE' },
        { id: 'legacy-pending', username: 'PendingViewer', status: 'PENDING_VERIFICATION' },
      ]);
      const identities = await client.query<{ normalized_identifier: string; verified: boolean }>(
        'SELECT normalized_identifier, verified_at IS NOT NULL AS verified FROM user_identities ORDER BY normalized_identifier',
      );
      expect(identities.rows).toEqual([
        { normalized_identifier: 'active@example.test', verified: true },
        { normalized_identifier: 'pending@example.test', verified: false },
      ]);
      expect(
        Number(
          (await client.query('SELECT count(*) AS count FROM password_credentials')).rows[0].count,
        ),
      ).toBe(1);
      expect(
        Number((await client.query('SELECT count(*) AS count FROM "User"')).rows[0].count),
      ).toBe(2);
      const timestamp = await client.query<{ data_type: string }>(
        `SELECT data_type FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'users' AND column_name = 'created_at'`,
        [schema],
      );
      expect(timestamp.rows[0]?.data_type).toBe('timestamp with time zone');
    } finally {
      await client.query('SET search_path TO public');
      await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await client.end();
    }
  });

  it('seeds permissions and system roles idempotently', async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is required');
    const schema = `seed_${randomUUID().replaceAll('-', '')}`;
    const admin = new Client({ connectionString: databaseUrl });
    await admin.connect();
    let db: DatabaseClient | undefined;
    try {
      await admin.query(`CREATE SCHEMA "${schema}"`);
      await admin.query(`SET search_path TO "${schema}"`);
      await admin.query(await migration('20260517144115_add_users'));
      await admin.query(await migration('20260918000100_add_auth_and_iam'));
      const scopedUrl = new URL(databaseUrl);
      scopedUrl.searchParams.set('options', `-c search_path=${schema}`);
      db = new DatabaseClient({ url: scopedUrl.toString() });
      await seedIam(db);
      const first = {
        roles: await db.role.count(),
        permissions: await db.permission.count(),
        mappings: await db.rolePermission.count(),
      };
      await seedIam(db);
      expect({
        roles: await db.role.count(),
        permissions: await db.permission.count(),
        mappings: await db.rolePermission.count(),
      }).toEqual(first);
      expect(first).toEqual({ roles: 2, permissions: 21, mappings: 24 });
    } finally {
      await db?.$disconnect();
      await admin.query('SET search_path TO public');
      await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await admin.end();
    }
  });
});

async function migration(name: string): Promise<string> {
  return readFile(resolve('prisma', 'migrations', name, 'migration.sql'), 'utf8');
}
