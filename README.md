# Cinema

A full-stack TypeScript monorepo: a NestJS api, two Next.js web apps and the shared packages
between them. Deployment is GitOps, kept in a sister repo,
[`cine-org/cinema-ops`](https://github.com/cine-org/cinema-ops).

## Stack

| Area     | Tools                                                                       |
| -------- | --------------------------------------------------------------------------- |
| Api      | NestJS 11, Prisma 7 on PostgreSQL, Redis, Zod, OpenAPI (Swagger)            |
| Web      | Next.js 15 (App Router), React 19, Tailwind CSS 4, shadcn/ui, openapi-fetch |
| Monorepo | pnpm workspaces, Turborepo, TypeScript                                      |
| Quality  | ESLint, Prettier, Jest, Vitest, lefthook, commitlint                        |
| Delivery | GitHub Actions builds images; Argo CD deploys what `cinema-ops` declares    |

## Highlights

- **Contract first.** The api generates its OpenAPI specs; `@repo/sdk-admin` and `@repo/sdk-user`
  turn them into types, and the web apps call the api through a client typed with those paths.
- **Two api surfaces.** Admin (`/admin/...`) and user endpoints are declared per controller and
  documented separately.
- **Layered modules.** Business modules split into `domain` / `app` / `infra`, with ports as
  abstract classes and queries separated from commands.
- **One image, any environment.**Thube web apps read env when the server starts, not at build
  time. See [Next Runtime Config](docs/apps/next-runtime-config.md).
- **Trunk-based flow with scopes.** Work branches squash into a scope branch, a scope squashes
  into `main`, and every merge to `main` goes to staging.

## Layout

```text
apps/      api · web-user · web-admin · worker · scheduler · integration
modules/   backend business modules: auth, users, theaters, common
packages/  database (Prisma) · sdk-user / sdk-admin (generated) · cache · rate-limit · utils
tooling/   shared eslint, tsconfig, jest and vitest presets
docker/    local development and test containers
docs/      short references, start at docs/README.md
```

Dependencies point one way: `apps → modules → packages`.

## Run locally

```bash
pnpm install
pnpm docker:infra     # PostgreSQL and Redis
pnpm db:migrate
pnpm dev:api          # api with its dependencies
pnpm dev:admin        # http://localhost:4001
```

First-time setup: [Workspace](docs/setup/workspace.md).

## Before a pull request

```bash
pnpm format:check && pnpm lint && pnpm build && pnpm typecheck && pnpm test
```

CI runs the same checks: [CI](docs/workflow/ci.md).

## Docs

[`docs/README.md`](docs/README.md) indexes architecture, conventions, setup and delivery.
