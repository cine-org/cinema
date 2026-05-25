# Package Template

Purpose: shared libraries under `packages/*`.

## When To Use

Use `packages/<name>` for reusable code that is not a backend business module.

Examples:

- generated clients
- shared contracts
- database access package
- runtime utilities
- logger/queue wrappers

## Minimal Shape

```text
packages/<name>/
  package.json
  tsconfig.json
  src/
    index.ts
```

Common scripts:

```json
{
  "build": "tsc -b",
  "typecheck": "tsc -b --noEmit",
  "test": "vitest run --passWithNoTests"
}
```

## Rules

- Export from `src/index.ts`.
- Do not import from `apps/*` or `modules/*`.
- If source imports generated files, put them under `src/generated`.
- Keep generated files reproducible and gitignored.

Related: [Architecture](../architecture/architecture.md), [TypeScript](../tooling/tsconfig.md)
