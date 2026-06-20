# Package Template

Purpose: reusable libraries under `packages/*`.

```text
packages/<name>/
  package.json
  tsconfig.json
  tsconfig.build.json
  vitest.config.ts
  src/
    index.ts
  test/
    ...mirror src
```

Package scripts:

```json
{
  "build": "tsc -p tsconfig.build.json",
  "dev": "tsc -p tsconfig.build.json --watch",
  "typecheck": "tsc -p tsconfig.json",
  "test": "pnpm test:unit",
  "test:unit": "vitest run --passWithNoTests"
}
```

Runtime metadata:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  }
}
```

Rules:

- Export only through `src/index.ts`.
- Consumers import the package root, never `src` or deep internal paths.
- Packages do not import apps or business modules.
- Generated dependencies live under `src/generated` and must be reproducible.
- Run package tasks through root Turbo commands when dependency build order matters.
