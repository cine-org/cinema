# TypeScript Config

Purpose: shared TypeScript presets in `@repo/typescript-config`.

## Presets

- `base.json`: strict shared foundation.
- `node.json`: Node/Nest packages with decorators enabled.
- `react-app.json`: React source code, Vite/browser.
- `react-node.json`: Vite/Vitest config files.

## Typical Usage

Node/Nest:

```json
{
  "extends": "@repo/typescript-config/node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "."
  }
}
```

React app:

```json
{
  "extends": "@repo/typescript-config/react-app.json",
  "compilerOptions": {
    "types": ["vite/client", "vitest/globals"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## Root `tsconfig.json`

Root only contains project references. Add every new app/package/module there when it should participate in `tsc -b`.

## Generated Code

Generated code imported by source should live under `src/generated`, for example:

```text
packages/api-client/src/generated/openapi/types.ts
packages/database/src/generated/prisma/
```
