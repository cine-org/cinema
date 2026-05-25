# Module Template

Purpose: backend business modules imported by Nest apps.

## When To Use

Use `modules/<name>` when code is backend business logic shared by one or more apps.

Do not create Dockerfiles here. Modules are not standalone services.

## Minimal Shape

```text
modules/<name>/
  package.json
  tsconfig.json
  jest.config.mjs
  src/
    index.ts
    <name>.module.ts
```

Optional clean-architecture folders:

```text
src/
  domain/
  application/
  infrastructure/
  presentation/
```

Keep the folder depth proportional to real complexity.

## Rules

- Export public API from `src/index.ts`.
- Apps import modules through `@repo/<name>`.
- Module code may depend on packages.
- Module code must not depend on apps.
- Domain code should not depend on Nest transport concepts.

## Add To Repo

1. Add package to `modules/<name>`.
2. Add root `tsconfig.json` reference.
3. Ensure root `eslint.config.mjs` includes `modules`.
4. Add dependency in consuming app package.

Related: [Architecture](../architecture/architecture.md)
