# Nest App Template

Purpose: checklist for a deployable Nest application.

```text
apps/<app>/
  package.json
  nest-cli.json
  tsconfig.json
  tsconfig.build.json
  jest.config.mjs
  Dockerfile
  src/
    main.ts
    app.module.ts
  test/
    ...mirror src
```

Required conventions:

- Extend `@repo/typescript-config/nest.json` from `tsconfig.json`.
- Include `src`, `test`, and optional scripts in the no-emit config.
- Build only `src` through `tsconfig.build.json`; entrypoint is `dist/main.js`.
- Use `@repo/jest-config` and keep tests under `test/`.
- Import workspace dependencies through package names, never `packages/*/src`.
- Keep local environment loading in app scripts and secrets outside images.

Typical scripts:

```json
{
  "build": "nest build",
  "dev": "... nest start --watch",
  "typecheck": "tsc --noEmit",
  "test": "pnpm test:unit",
  "test:unit": "... jest --config jest.config.mjs --passWithNoTests",
  "test:int": "... jest --testRegex '.int-spec.ts$' --passWithNoTests",
  "test:e2e": "... jest --testRegex '.e2e-spec.ts$' --passWithNoTests"
}
```

Register deployable apps in Docker compose, image detection, and deploy scripts. Business logic belongs in `modules/*` when it becomes domain-heavy or reusable.
