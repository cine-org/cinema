# ESLint

Purpose: shared flat-config presets in `@repo/eslint-config`.

Presets:

- `basePreset`: common TypeScript and formatting rules.
- `nodePreset`: Nest apps, modules, packages, Prisma scripts.
- `nextPreset`: Next.js and React Hooks rules with monorepo app roots.
- `javascriptPreset`: JavaScript configuration files.
- `toolingPreset`: relaxed rules for configuration packages.

Typed linting uses TypeScript project service. Every TypeScript source, test, Prisma script, and config file should belong to a real `tsconfig.json`; avoid `allowDefaultProject` exceptions.

```bash
pnpm build:eslint
pnpm lint
pnpm lint:fix
```
