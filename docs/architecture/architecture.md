# Architecture

Purpose: high-level map of the monorepo and dependency direction.

## Repo Shape

```text
apps/            runnable apps and Docker images
modules/         backend business modules
packages/        shared libraries, clients, contracts
tooling/         eslint, tsconfig, jest, vitest presets
docker/          local development containers
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

- `@repo/database`: Prisma schema, migrations, generated client. Migrations ship inside the api image.
- `@repo/sdk-user`, `@repo/sdk-admin`: OpenAPI-generated types, one package per API surface.
- `@repo/utils`, `@repo/logger`, `@repo/queue`: shared runtime utilities.

## Modules

`modules/*` holds backend business capabilities. Apps import modules; modules should not import apps.
Each module owns its error codes; `@repo/common` holds the generic ones. See [Module Template](../modules/template.md)
for the query and command conventions.

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
- OpenAPI JSON artifacts: generated from `apps/api` into `generated/openapi/user.json` and `admin.json`;
  controllers declare their surface with `@UserApi` / `@AdminApi` (admin routes live under `/admin`).
- SDK types: generated in `packages/sdk-*/src/generated`.
- Database schema: `packages/database/prisma/schema.prisma`.
- Deploy images: GHCR.

## Related

- [Docker](../infra/docker.md)
- [CI](../workflow/ci.md)
