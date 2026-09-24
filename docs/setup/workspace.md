# Workspace

Purpose: first local setup.

## Requirements

- Node.js `22+`
- pnpm `10.33.0`
- Docker Desktop when using DB/Redis or local compose

```bash
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm install
```

## Env Files

Each app, `packages/database` (Prisma CLI) and `docker/` owns its `.env`; there is no root `.env`.
Shared values such as `DATABASE_URL` are repeated on purpose, like each deployment's own env:

```bash
for f in $(git ls-files '*.env.example'); do cp -n "$f" "${f%.example}"; done
```

Use the local values shown in comments when running outside deploy.

Test uses a separate `.env.test` next to each `.env` that needs one:

```bash
for f in $(git ls-files '*.env.test.example'); do cp -n "$f" "${f%.example}"; done
```

Deploy env files live on the VPS, outside the repo:

```text
/etc/cinema/env
```

## Common Start

```bash
pnpm docker:infra
pnpm dev:api
pnpm dev:fe
```

## Validate

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Related: [Root Scripts](package-json.md), [Local Testing](../tooling/local-testing.md)
