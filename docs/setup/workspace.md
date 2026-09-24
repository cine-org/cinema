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

Local dev uses normal `.env` files:

```bash
cp .env.example .env
cp docker/.env.example docker/.env
cp apps/api/.env.example apps/api/.env
cp apps/web-user/.env.example apps/web-user/.env
cp apps/web-admin/.env.example apps/web-admin/.env
cp apps/integration/.env.example apps/integration/.env
cp apps/scheduler/.env.example apps/scheduler/.env
cp apps/worker/.env.example apps/worker/.env
```

Use the local values shown in comments when running outside deploy.

Test uses a separate env:

```bash
cp .env.test.example .env.test
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
