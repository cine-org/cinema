# Docker

Purpose: local compose, test compose, and VPS compose layout.

## Files

```text
infrastructure/docker/
  compose.yml             base volumes, networks, service includes
  compose.local.yml       local build/env overlay
  compose.test.yml        Postgres for tests only
  compose.staging.yml     staging env overlay
  compose.production.yml  production env overlay
  infra/                  postgres/provisioning, PgBouncer, optional Redis, nginx
  services/               app service definitions
```

Base compose avoids hardcoded release images. Deploy injects images through temporary `infrastructure/docker/override.yml`.

## Local

```bash
pnpm docker:infra
pnpm docker:redis
pnpm docker:up
pnpm docker:down
pnpm docker:logs
```

Local compose uses:

```text
infrastructure/docker/.env
.env
apps/*/.env
```

## Test Infra

```bash
pnpm docker:test:up
pnpm docker:test:down
```

Test compose is isolated:

```text
project: cinema-test
postgres: localhost:5433
```

## VPS Layout

```text
/opt/cinema/
  current -> /opt/cinema/releases/<id>
  releases/
    <id>/
      infrastructure/
        docker/
        nginx/
        scripts/deploy-runtime.sh
        scripts/deploy-staging.sh
        scripts/deploy-production.sh

/etc/cinema/env/
  docker.env
  shared.env
  migrator.env
  api.env
  scheduler.env
  worker.env
  integration.env
  web-user.env
  web-admin.env

/etc/cinema/secrets/
  pgbouncer-userlist.txt

/etc/cinema/ssl/
  fullchain.pem
  privkey.pem
```

GitHub Actions uploads `deploy-artifact.tar.gz`; the VPS extracts it under `/opt/cinema/releases/<id>` and updates `/opt/cinema/current`.

## Deploy Rule

- Staging uses image tag `latest`.
- Production uses `release-manifest.yml`.
- PostgreSQL roles are provisioned before `migrator`.
- `migrator` connects directly as `cinema_migrator`.
- Runtime services connect through PgBouncer as `cinema_app`.
- Runtime grants are reconciled and verified after migration.
- Secrets/env stay outside artifacts in `/etc/cinema/env`.

Related: [Staging](../workflow/staging.md), [Deploy](../workflow/deploy.md)
