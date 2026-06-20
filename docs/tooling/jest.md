# Jest

Purpose: test Nest applications with Jest 29 and ts-jest 29.

Each Nest app uses:

```js
import { nestConfig } from '@repo/jest-config';

export default nestConfig();
```

The shared config resolves only the app-local `@/*` alias. Workspace dependencies resolve through their package exports and must be built by Turbo first.

Naming:

- Unit: `test/**/*.spec.ts`
- Integration: `test/**/*.int-spec.ts`
- E2E: `test/**/*.e2e-spec.ts`

Run tests through root Turbo scripts so dependency `dist` outputs exist:

```bash
pnpm test
pnpm test:int
pnpm test:e2e
pnpm test:cov
```

Related: [Local Testing](local-testing.md)
