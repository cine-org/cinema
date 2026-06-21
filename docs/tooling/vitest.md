# Vitest

Purpose: test Next applications and lightweight Node modules/packages.

Shared presets:

- `browserConfig`: jsdom, CSS support, browser coverage defaults.
- `nodeConfig`: Node environment and Node coverage defaults.

Both discover mirrored tests under `test/`:

```text
test/**/*.spec.ts
test/**/*.int-spec.ts
test/**/*.e2e-spec.ts
```

Nest applications continue to use Jest. Browser test setup stays local to each Next app because mocks and environment setup are app-specific.

When a web app gains DOM tests, add `test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Then reference it from that app's `vitest.config.ts`:

```ts
export default browserConfig({
  test: {
    setupFiles: ['./test/setup.ts'],
  },
});
```

Install `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, and `jsdom` in the app that uses them. Do not create a shared setup package unless substantial reusable behavior emerges.

Run tests through Turbo:

```bash
pnpm test
pnpm test:watch
pnpm test:cov
```
