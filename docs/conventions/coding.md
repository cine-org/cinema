# Coding

Purpose: repo-wide code style and architectural guardrails.

## TypeScript

- Prefer explicit types at boundaries.
- Avoid `any`; use `unknown` or a concrete type.
- Await promises or handle with `.catch()`.
- Keep comments rare; explain why, not what.

## Boundaries

- Use workspace imports: `@repo/database`, `@repo/common`, etc.
- Use app-local alias `@/*` only inside that app/package.
- Do not cross package boundaries with deep relative imports.
- Do not import app code from modules or packages.

## Backend

- Controllers adapt transport input/output.
- Services/application handlers own use-case logic.
- Domain code should not throw Nest `HttpException`.
- Request DTOs validate with `class-validator`; the global `RequestValidationPipe` turns failures into `VALIDATION` errors with `field`.
- Use shared app exceptions from `modules/common` for business errors.
- No side effects at import (env parsing, connections); do them at bootstrap so tooling like OpenAPI generation can load modules.

## Frontend

- Runtime public config is served by the Next `/runtime-config` route, with `NEXT_PUBLIC_*` as the build-time fallback.
- App code should consume `config`, not read `process.env.NEXT_PUBLIC_*` throughout feature code.
- API calls should go through `@repo/api-client` or app-level API helpers.

## Tests

- Unit: mirrored under `test/`, `*.spec.ts`.
- Integration: real DB/Redis when needed, `*.int-spec.ts`.
- E2E: app boundary tests, `*.e2e-spec.ts`.

Related: [Local Testing](../tooling/local-testing.md)
