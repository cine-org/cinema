# Prisma

Purpose: database schema, migrations, and generated Prisma client.

## Source Of Truth

```text
packages/database/prisma/schema.prisma
```

Generated client:

```text
packages/database/src/generated/prisma/
```

## Local Dev

```bash
pnpm docker:infra
pnpm db:migrate
pnpm db:seed
```

Useful commands:

```bash
pnpm db:generate
pnpm db:reset
pnpm db:studio
```

## Test DB

```bash
pnpm docker:test:up
pnpm db:test:deploy
pnpm db:test:seed
```

Dev DB uses `packages/database/.env`, test DB uses `packages/database/.env.test`.

## Seed

- Each module owns its seed in `modules/<name>/seed/`, built from its own handlers (e.g. real argon2 hashes).
- `pnpm db:seed` loads `packages/database/.env` and runs every module's `db:seed` through Turbo, dependencies first.
- Seeds are dev/test data only and never run in production; they must be safe to repeat.
- Reference data every environment needs (genres, seat types...) goes in a migration, not a seed.
- `pnpm db:reset` no longer seeds; run `pnpm db:seed` after it.

## Deploy

The api image is also the migrator: it carries `prisma/` and `prisma.config.ts`. Before the api rolls
out, a Job runs it with the owner role's `DATABASE_URL`:

```bash
node_modules/.bin/prisma migrate deploy
```

The api container itself keeps the `cinema_rw` / `cinema_ro` URLs, so it can never run DDL.
Never run `db:migrate`, `db:push` or `db:reset` against staging or production.

Related: [Docker](../../infra/docker.md), [Local Testing](../../tooling/local-testing.md)
