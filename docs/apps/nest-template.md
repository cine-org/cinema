# Nest App Template

Purpose: checklist for adding a deployable NestJS app.

## Minimal Files

```text
apps/<app>/
  package.json
  tsconfig.json
  nest-cli.json
  jest.config.mjs
  Dockerfile
  src/
    main.ts
    app.module.ts
  test/
```

## Package Scripts

Required shape:

```json
{
  "build": "nest build",
  "dev": "... nest start --watch",
  "typecheck": "tsc -b --noEmit",
  "test": "jest --passWithNoTests",
  "test:int": "jest --passWithNoTests",
  "test:e2e": "jest --passWithNoTests",
  "test:cov": "jest --coverage"
}
```

## Config

- Extend `@repo/typescript-config/node.json`.
- Use `@repo/jest-config`.
- Load root `.env` plus app `.env` for local dev.
- Keep runtime secrets outside images.

## Docker/Deploy Registration

Add:

- `apps/<app>/Dockerfile`
- `infrastructure/docker/services/<app>.yml`
- service blocks in `compose.local.yml`, `compose.staging.yml`, `compose.production.yml`
- image name to `.github/actions/docker-build-push/action.yml` only if Dockerfile path is special
- app name to `infrastructure/scripts/deploy.sh` arrays if it is deployable

## Rule

Apps own transport/runtime wiring. Business logic should move to `modules/*` when it becomes reusable or domain-heavy.

Related: [Architecture](../architecture/architecture.md), [Docker](../infra/docker.md)
