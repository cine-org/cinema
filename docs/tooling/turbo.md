# Turbo

Purpose: the single workspace task graph used by root scripts, CI, and Docker builds.

Key tasks:

- `build`: builds `^build` dependencies first and caches production outputs.
- `generate`: builds dependencies before generating OpenAPI or Prisma artifacts.
- `typecheck`: follows the configured build dependency graph.
- `test*`: builds workspace dependencies before loading their package exports.
- `dev`: persistent and uncached; filtered root scripts include package dependencies so library watchers run beside apps.

Examples:

```bash
pnpm build
pnpm typecheck
pnpm test
pnpm exec turbo run build --dry-run=json
pnpm exec turbo run test --affected
```

Do not bypass root/Turbo commands in CI or staging. Remote cache may improve speed, but every task must also work from a clean checkout.
