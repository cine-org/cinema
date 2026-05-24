# Coding

Purpose: repo-wide code style and architectural guardrails.

## TypeScript

- Prefer explicit types at boundaries.
- Avoid `any`; use `unknown` or a concrete type.
- Await promises or handle with `.catch()`.
- Keep comments rare; explain why, not what.

## Boundaries

- Use workspace imports: `@repo/database`, `@repo/contracts`, etc.
- Use app-local alias `@/*` only inside that app/package.
- Do not cross package boundaries with deep relative imports.
- Do not import app code from modules or packages.

## Backend

- Controllers adapt transport input/output.
- Services/application handlers own use-case logic.
- Domain code should not throw Nest `HttpException`.
- Use shared app exceptions from `modules/shared` for business errors.

## Frontend

- Runtime public config is read from `window.__APP_CONFIG__`, then Vite env fallback.
- App code should consume `config`, not raw `import.meta.env`.
- API calls should go through `@repo/api-client` or app-level API helpers.

## Tests

- Unit: close to source, `*.spec.ts`.
- Integration: real DB/Redis when needed, `*.int-spec.ts`.
- E2E: app boundary tests, `*.e2e-spec.ts`.

Related: [Local Testing](../tooling/local-testing.md)
