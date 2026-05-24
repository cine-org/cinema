# Vitest

Purpose: Vitest is used for React apps and lightweight Node packages.

## Package

```text
tooling/vitest-config -> @repo/vitest-config
```

Presets:

- `browserConfig`: React/Vite apps, jsdom.
- `nodeConfig`: Node packages.

Example:

```ts
import { nodeConfig } from '@repo/vitest-config';

export default nodeConfig();
```

## Commands

```bash
pnpm test
pnpm test:watch
pnpm test:cov
```

Use Jest for Nest-heavy code when decorators/testing module support is needed.
