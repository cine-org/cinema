# CI

Purpose: PR quality gate. No deploys.

## Files

```text
.github/workflows/ci.yml
.github/actions/setup/            pnpm + Node (.nvmrc) + pnpm install
.github/actions/docker-build/     build one app image
.github/scripts/detect-changes.sh which jobs and images a change needs
```

## Trigger

Every pull request, whatever the base branch; draft PRs run too. Pushing a branch without a PR runs nothing.

## Jobs

```text
changes ─┬─ lint ────────┐
         ├─ test ────────┤
         ├─ build ───────┼─ ci (gate)
         └─ docker (app) ┘
```

| Job            | Runs when             | Steps                                                                |
| -------------- | --------------------- | -------------------------------------------------------------------- |
| `changes`      | always                | warn if Turbo remote cache is missing; compute `code` and `images`   |
| `lint`         | `code`                | `format:check`, `openapi:check`, generate API client, `lint`         |
| `test`         | `code`                | test Postgres/Redis, `db:test:deploy`, `db:test:check`, unit/int/e2e |
| `build`        | `code`                | `build`, `typecheck`                                                 |
| `docker (app)` | `images` is not empty | build the app image, no push (GitHub Actions cache per app)          |
| `ci`           | always                | fails if any job above failed or was cancelled                       |

`detect-changes.sh` outputs:

- `code`: any file besides `*.md` / `LICENSE` changed.
- `images`: apps affected according to the Turbo dependency graph (`...[base]`), plus all apps
  when root build files change (`package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`,
  `turbo.json`, `.dockerignore`), plus web apps when the committed OpenAPI schema changes.

## Required check

The ruleset requires only `ci`. Skipped jobs count as passed, so docs-only PRs still go green, and
adding or renaming jobs never needs a ruleset change. Do not use `paths-ignore`: a workflow that
does not run never reports its check, and the PR waits forever.

## Checks worth knowing

- `openapi:check`: regenerates `apps/api/generated/openapi/schema.json` and fails if it differs
  from the committed file.
- `db:test:check`: after applying migrations, fails if `schema.prisma` still differs from the
  database, i.e. a schema change has no migration.
- Docker builds catch what `build` cannot, e.g. a workspace import missing from `package.json`
  that works through hoisting locally but not after `turbo prune`.

## Notes

- CI uses `docker/compose.test.yml` via `pnpm docker:test:up`, the same test stack as local, with
  every `.env.test.example` copied to `.env.test`.
- Every check is a root `pnpm` script, so it can be run locally the same way.

Related: [Local Testing](../tooling/local-testing.md)
