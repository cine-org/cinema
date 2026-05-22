# Docker

Purpose: local containers and deploy compose files.

## Local Setup

Create compose vars:

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env
```

Create app env files:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web-user/.env.example apps/web-user/.env
cp apps/web-admin/.env.example apps/web-admin/.env
cp apps/integration/.env.example apps/integration/.env
cp apps/scheduler/.env.example apps/scheduler/.env
cp apps/worker/.env.example apps/worker/.env
```

## Commands

```bash
pnpm docker:build
pnpm docker:up
pnpm docker:infra
pnpm docker:logs
pnpm docker:down
```

Root scripts use:

```text
--env-file infrastructure/docker/.env
compose.yml
compose.local.yml
```

## Env Files

`infrastructure/docker/.env` is only for compose/infra variables:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
POSTGRES_PORT
REDIS_PASSWORD
REDIS_PORT
```

Application env belongs in root/app `.env` files. Nginx runtime hostnames belong in:

```text
/etc/cinema/env/nginx.env
```

with example source:

```text
infrastructure/nginx/.env.example
```

## Deploy

Do not run production compose directly on the VPS. Deploy uses the uploaded artifact plus `deploy.sh`, which generates `infrastructure/docker/override.yml` with image names from a tag or release manifest.
