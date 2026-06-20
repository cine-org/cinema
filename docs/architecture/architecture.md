# Architecture

Purpose: high-level map of the monorepo and dependency direction.

## Repo Shape

```text
apps/            runnable apps and Docker images
modules/         backend business modules
packages/        shared libraries, clients, contracts
tooling/         eslint, tsconfig, jest, vitest presets
infrastructure/  docker, nginx, deploy runtime scripts
docs/            short project references
```

## Apps

- `api`: NestJS HTTP API. API source of truth for OpenAPI.
- `scheduler`: NestJS background scheduler.
- `worker`: NestJS background worker.
- `integration`: NestJS integration service.
- `web-user`: Next.js user app.
- `web-admin`: Next.js admin app.

## Packages

- `@repo/database`: Prisma schema, migrations, generated client, migrator image.
- `@repo/contracts`: shared non-endpoint wire contracts such as errors/common types.
- `@repo/api-client`: OpenAPI-generated types plus thin client helpers.
- `@repo/utils`, `@repo/logger`, `@repo/queue`: shared runtime utilities.

## Modules

`modules/*` holds backend business capabilities. Apps import modules; modules should not import apps.

Recommended direction:

```text
apps/* -> modules/* -> packages/*
apps/* -> packages/*
packages/* -> packages/*
```

Forbidden direction:

```text
packages/* -> apps/*
packages/* -> modules/*
modules/* -> apps/*
domain code -> Nest HTTP exceptions
```

## Source Of Truth

- API endpoints and DTOs: `apps/api`.
- OpenAPI JSON artifact: generated from `apps/api`.
- API client types: generated in `packages/api-client/src/generated`.
- Database schema: `packages/database/prisma/schema.prisma`.
- Deploy images: GHCR.
- Release deploy: GitHub Release `release-manifest.yml` + `deploy-artifact.tar.gz`.

## Related

- [Docker](../infra/docker.md)
- [CI](../workflow/ci.md)
- [Release](../workflow/release.md)
