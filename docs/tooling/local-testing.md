# Local Testing

Purpose: local test flow should match CI as closely as possible.

## Env

DB-backed tests (`test:int`, `test:e2e`, `db:test:*`) read the package's own `.env.test`; unit tests need no env.

```bash
for f in $(git ls-files '*.env.test.example'); do cp -n "$f" "${f%.example}"; done
```

## Test Types

- Unit: isolated logic, no Docker required.
- Coverage: unit run with coverage output.
- Integration: real dependencies such as Postgres, Redis, Prisma.
- E2E: app boundary tests, usually HTTP.

## Fast Local Check

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:cov
```

## DB-backed Local Check

```bash
pnpm docker:test:up
pnpm db:test:deploy
pnpm test:int
pnpm test:e2e
```

Stop infra:

```bash
pnpm docker:test:down
```

## Target One Package

```bash
pnpm test --filter=@repo/api
pnpm test:int --filter=@repo/database
pnpm test:e2e --filter=@repo/api
```

## CI Shape

CI copies every `.env.test.example`, runs quality checks, starts Postgres/Redis only for integration/e2e, then applies `pnpm db:test:deploy`.

Related: [CI](../workflow/ci.md)
