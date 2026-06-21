# Module Template

Purpose: backend capability packages imported by Nest apps.

```text
modules/<name>/
  package.json
  tsconfig.json
  tsconfig.build.json
  vitest.config.ts
  src/
    index.ts
    <name>.module.ts
  test/
    ...mirror src
```

Optional source layers are `domain`, `application`, `infrastructure`, and `presentation`. Add only the layers required by real behavior.

Rules:

- Export the public API from `src/index.ts`.
- Expose `main`, `types`, and the `types`/`default` export conditions from `dist`.
- Use Vitest for domain/application unit tests; Nest app integration remains in app Jest tests.
- Apps import `@repo/<name>`; modules may import packages but never apps.
- Domain code must not depend on HTTP or Nest transport exceptions.
- Root scripts and CI discover the module through Turbo; do not add root TypeScript project references.

Related: [Architecture](../architecture/architecture.md), [Package Template](../packages/template.md)
