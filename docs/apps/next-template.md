# Next App Template

Purpose: checklist for a deployable Next.js App Router application.

```text
apps/<app>/
  package.json
  next.config.ts
  tsconfig.json
  vitest.config.ts
  Dockerfile
  public/
  src/
    app/
    components/
    config/
    features/
    layouts/
  test/
    ...mirror src
```

Required conventions:

- Extend `@repo/typescript-config/next.json`.
- Use `@repo/vitest-config`. Add an app-local `test/setup.ts` only when DOM tests need Testing Library or jest-dom setup.
- Keep app routes thin and place page behavior in `features/*`.
- Use `NEXT_PUBLIC_*` only for values intentionally embedded at build time.
- Use the existing `/runtime-config` endpoint for values supplied when the container starts.
- Build through Turbo so `@repo/api-client`, contracts, and utilities are ready first.
- Keep `output: 'standalone'` for Linux/Docker builds.

Typical scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests",
  "test:cov": "vitest run --coverage --passWithNoTests"
}
```
