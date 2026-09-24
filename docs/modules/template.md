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
  seed/          optional dev/test data, run by `pnpm db:seed` (see Prisma docs)
    seed.ts
  test/
    ...mirror src
```

Source layers are `domain`, `app`, and `infra`. Add only the layers required by real behavior.

```text
src/
  domain/      entities, value objects, exceptions, error codes
  app/         commands/, queries/, ports/, views/
  infra/       persistence/, security/... one adapter per port
```

## Query And Command

- A query handler returns a view (`app/views/`) or a primitive, never an entity.
- A command handler returns `void`, or the id of what it created.
- Entities stay inside the module: a command loads one through the write port, calls its methods, saves it.
- Read adapters build the view with `select`; only write adapters use a mapper.
- Apps map a view into their own DTO; DTOs live in controllers.

Rules:

- Export the public API from `src/index.ts`.
- Expose `main`, `types`, and the `types`/`default` export conditions from `dist`.
- Use Vitest for domain/application unit tests; Nest app integration remains in app Jest tests.
- Apps import `@repo/<name>`; modules may import packages but never apps.
- Ports are abstract classes in `app/ports/`: the class is its own DI token (`{ provide: UserReadRepository, useClass: PrismaUserReadRepository }`), so handlers need no `@Inject`.
- Domain code must not depend on HTTP or Nest transport exceptions.
- Error codes are `MODULE.CODE` (e.g. `USER.NOT_FOUND`); only `@repo/common` codes have no prefix (`NOT_FOUND`).
- Root scripts and CI discover the module through Turbo; do not add root TypeScript project references.

Related: [Architecture](../architecture/architecture.md), [Package Template](../packages/template.md)
