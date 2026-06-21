# Frontend Structure

Purpose: shared Next.js App Router conventions for `web-user` and `web-admin`.

```text
src/
  app/          routes, layouts, providers, route handlers
  components/   reusable application UI
  config/       runtime and build-time configuration
  features/     feature-owned UI, hooks, API calls, and page components
  layouts/      reusable page shells
```

## Ownership

- `src/app` owns routing and framework entrypoints. Route files should compose feature pages rather than hold substantial behavior.
- `src/features/<name>` owns feature-specific components, hooks, API calls, services, and types.
- `src/components` contains UI reused by multiple features. Keep single-feature components inside their feature.
- `src/config` is the only application-facing entrypoint for environment/runtime configuration.

## API Client

Feature API code uses `@repo/api-client`. Endpoint types are generated from the Nest OpenAPI schema; do not duplicate response types inside a web app.

## Environment

- `/runtime-config` exposes values supplied when the container starts.
- `NEXT_PUBLIC_*` is only a build-time fallback for values safe to expose to browsers.
- Do not use `VITE_*` variables.

## Imports

- Use `@/*` for app-local source.
- Import workspace libraries through their public package names.
- Do not deep-import another feature's internal files; promote genuinely shared code instead.
