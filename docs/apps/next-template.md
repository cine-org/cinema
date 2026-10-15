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
    ...         see frontend-structure.md
  test/
    ...mirror src
```

Required conventions:

- Extend `@repo/typescript-config/next.json`.
- Use `@repo/vitest-config`. Add an app-local `test/setup.ts` only when DOM tests need Testing Library or jest-dom setup.
- Follow `frontend-structure.md` for source layout, naming, and SEO.
- Use `NEXT_PUBLIC_*` only for values intentionally embedded at build time.
- Read values supplied when the container starts in a server layout (`getConfig()`) and pass them down with `ConfigProvider`; see `frontend-structure.md`.
- Build through Turbo so the app's SDK (`@repo/sdk-user` or `@repo/sdk-admin`), contracts, and utilities are ready first.
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
