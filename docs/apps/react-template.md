# React App Template

Purpose: checklist for adding a deployable React/Vite SPA.

## Minimal Files

```text
apps/<app>/
  package.json
  tsconfig.json
  tsconfig.app.json
  tsconfig.node.json
  vite.config.ts
  vitest.config.ts
  Dockerfile
  nginx.conf
  public/config.js
  scripts/write-runtime-config.sh
  src/
    main.tsx
    config/config.ts
```

## Runtime Config

Runtime-first public config:

```text
window.__APP_CONFIG__ -> import.meta.env -> default
```

Current split:

```text
API_ORIGIN
API_PREFIX
```

App code should consume `config.apiBaseUrl`.

## Package Scripts

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "typecheck": "tsc -b --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:cov": "vitest run --coverage"
}
```

## Docker/Deploy Registration

Add:

- `apps/<app>/Dockerfile`
- `apps/<app>/nginx.conf`
- `apps/<app>/scripts/write-runtime-config.sh`
- `infrastructure/docker/services/<app>.yml`
- service blocks in compose overlays
- app name in deploy script arrays if deployable

Related: [Docker](../infra/docker.md), [Vitest](../tooling/vitest.md)
