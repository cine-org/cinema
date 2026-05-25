# Root Scripts

Purpose: quick command reference for `package.json`.

## Quality

```bash
pnpm lint
pnpm lint:fix
pnpm typecheck
pnpm test
pnpm test:cov
pnpm format
```

## Test Types

```bash
pnpm test:unit
pnpm test:int
pnpm test:e2e
```

## Dev

```bash
pnpm dev
pnpm dev:be
pnpm dev:fe
pnpm dev:api
pnpm dev:web
pnpm dev:admin
```

## Build

```bash
pnpm build
pnpm build:be
pnpm build:fe
pnpm build:api
```

## Database

```bash
pnpm db:generate
pnpm db:migrate
pnpm db:deploy
pnpm db:reset
pnpm db:seed
pnpm db:studio
```

Test database:

```bash
pnpm db:test:deploy
pnpm db:test:reset
pnpm db:test:seed
```

## Docker

```bash
pnpm docker:infra
pnpm docker:up
pnpm docker:down
pnpm docker:logs
pnpm docker:test:up
pnpm docker:test:down
```

## Generated Client

```bash
pnpm openapi:generate
```

Related: [Local Testing](../tooling/local-testing.md), [Docker](../infra/docker.md)
