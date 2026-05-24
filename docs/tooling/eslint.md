# ESLint

Purpose: shared lint presets live in `@repo/eslint-config`.

## Files

```text
tooling/eslint-config/
  base.ts
  node.ts
  react.ts
  js.ts
  tooling.ts
```

## Presets

- `basePreset`: common TS/JS rules.
- `nodePreset`: Node/Nest apps, modules, packages.
- `reactPreset`: React apps.
- `javascriptPreset`: JS/MJS/CJS files.
- `toolingPreset`: config packages under `tooling`.

## Rules To Remember

- `any` is warned.
- unsafe/floating promise rules are enabled for typed projects.
- Prettier formatting is integrated through ESLint config, but `prettier/prettier` may be disabled in selected layers.

## Commands

```bash
pnpm --filter @repo/eslint-config build
pnpm lint
pnpm lint:fix
```

When adding a new typed project, add its directory to the right preset in root `eslint.config.mjs`.
