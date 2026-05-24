# Jest

Purpose: Jest is used mainly for NestJS apps/modules.

## Package

```text
tooling/jest-config -> @repo/jest-config
```

Use `nestConfig` in `jest.config.mjs`:

```js
import { nestConfig } from '@repo/jest-config';

export default nestConfig();
```

## Naming

- Unit: `*.spec.ts`
- Integration: `*.int-spec.ts`
- E2E: `*.e2e-spec.ts`

## Commands

```bash
pnpm test
pnpm test:unit
pnpm test:int
pnpm test:e2e
pnpm test:cov
```

Related: [Local Testing](local-testing.md)
