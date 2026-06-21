# TypeScript Config

Purpose: shared TypeScript presets and a consistent typecheck/build boundary.

## Presets

- `base.json`: strict defaults shared by all TypeScript projects.
- `node.json`: generic Node.js packages using NodeNext resolution.
- `nest.json`: Node preset plus decorators and metadata.
- `next.json`: browser, JSX, bundler resolution, and the Next plugin.

## Nest Apps

`tsconfig.json` covers `src` and `test` for editors, ESLint, and typecheck. `tsconfig.build.json` emits only `src`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "rootDir": "./src",
    "outDir": "./dist"
  },
  "include": ["src/**/*"]
}
```

Nest CLI automatically uses `tsconfig.build.json`. The runtime entrypoint is `dist/main.js`.

Operational scripts stay outside `src`. The OpenAPI generator is a small `.mjs` runner that builds the API first and imports the compiled OpenAPI module from `dist`; it is linted as JavaScript and is not part of the TypeScript production output.

## Modules And Packages

Libraries use two configs:

- `tsconfig.json`: no emit; includes `src`, mirrored `test`, and config/scripts that require typechecking.
- `tsconfig.build.json`: emits declarations and JavaScript from `src` to `dist`.

Package metadata must expose `dist`, never `src`. Consumers import the public package root, not internal source paths.

## Root Config

Root `tsconfig.json` has no project references. Turbo owns the workspace task graph and invokes each package's `typecheck` or `build` script.

Generated code imported by source stays under `src/generated`, including Prisma and OpenAPI output.
