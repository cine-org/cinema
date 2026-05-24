# Prisma

Purpose: database schema, migrations, generated Prisma client, and seed flow.

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

Test DB uses `.env.test`.

## Deploy

Production/staging migrations run through the `migrator` image before backend deploys.

Do not run these in production:

```bash
pnpm db:migrate
pnpm db:push
pnpm db:reset
```

Use deploy migration only:

```bash
pnpm db:deploy
```

Related: [Docker](../../infra/docker.md), [Local Testing](../../tooling/local-testing.md)
