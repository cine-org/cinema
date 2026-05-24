# Turbo

Purpose: task graph and caching.

## Key Tasks

- `build`: depends on `^build`, outputs `dist/**`.
- `generate`: depends on `^build`, outputs `generated/**` and `src/generated/**`.
- `typecheck`: depends on `build` and `^build`.
- `test`, `test:unit`, `test:int`, `test:e2e`: depend on `^build`.
- `dev`, `preview`, `lint:fix`, `clean`: not cached.

`^build` means workspace dependencies build first.

## Commands

```bash
pnpm turbo run build
pnpm turbo run typecheck --filter=@repo/api
pnpm turbo run test --affected
pnpm turbo run build --dry-run=json
```

## Remote Cache

CI can use `TURBO_TOKEN` and `TURBO_TEAM`. Do not rely on cache for correctness; scripts must work from a clean checkout.
