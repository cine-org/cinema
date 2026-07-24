# Docker

Purpose: local containers and deploy compose files.

## Local Setup

Create compose vars:

```bash
cp infrastructure/docker/.env.example infrastructure/docker/.env
```

Create the PgBouncer authentication file:

```bash
mkdir -p infrastructure/docker/infra/pgbouncer/.secrets
cp infrastructure/docker/infra/pgbouncer/userlist.txt.example \
  infrastructure/docker/infra/pgbouncer/.secrets/userlist.txt
chmod 700 infrastructure/docker/infra/pgbouncer/.secrets
chmod 644 infrastructure/docker/infra/pgbouncer/.secrets/userlist.txt
```

The containing directory prevents other local users from reading the file. The `cinema_app`
password must match `DB_APP_PASSWORD`.

PgBouncer runs as UID `1001`. On staging and production, own the auth file with UID `1001`, set
mode `600`, and never commit it.

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
DB_MAX_CONNECTIONS
DB_APP_USER
DB_APP_PASSWORD
DB_MIGRATOR_USER
DB_MIGRATOR_PASSWORD
PGBOUNCER_AUTH_FILE
REDIS_PASSWORD
REDIS_PORT
```

For deployed environments:

```text
/etc/cinema/env/shared.env    DATABASE_URL for cinema_app through pgbouncer:6432
/etc/cinema/env/migrator.env  DATABASE_URL for cinema_migrator through postgres:5432
/etc/cinema/env/docker.env    bootstrap and provisioning variables
/etc/cinema/secrets/pgbouncer-userlist.txt
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

Do not run production compose directly on the VPS. Deploy uses the uploaded artifact plus the environment deploy script, which generates `infrastructure/docker/compose.override.yml` with image names from `latest` on staging or the release manifest on production.

Backend deploy order is:

```text
postgres
-> database role provisioning
-> Prisma migration through the direct connection
-> runtime privilege reconciliation and verification
-> PgBouncer
-> backend applications
```

Provisioning does not rotate existing role passwords. Rotate PostgreSQL credentials, the external
environment files, and the PgBouncer auth file as one explicit operations change.

For a database created before the dedicated roles existed, back it up and run once:

```bash
pnpm docker:db:adopt
```

Normal deployments never run this ownership rollout automatically.
