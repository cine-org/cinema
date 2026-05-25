# Tooling

Dev-only packages — shared configs và test utilities. Không có runtime code, không build.

## Packages

| Package             | Dùng bởi             | Mô tả                                                 |
| ------------------- | -------------------- | ----------------------------------------------------- |
| `eslint-config`     | Tất cả apps          | ESLint flat configs: base, node, react                |
| `typescript-config` | Tất cả apps          | tsconfig presets: base, node, react-app, react-node   |
| `jest-config`       | NestJS apps          | Jest preset + `nestConfig()` factory                  |
| `vitest-config`     | React apps, packages | Vitest base config: `browserConfig()`, `nodeConfig()` |
| `test-setup`        | Tất cả apps          | Shared setup files: env, mocks, factories             |

## Dùng trong apps

```json
"devDependencies": {
  "@repo/eslint-config": "workspace:*",
  "@repo/typescript-config": "workspace:*",
  "@repo/jest-config": "workspace:*",      // NestJS apps
  "@repo/vitest-config": "workspace:*",    // React apps, packages
  "@repo/test-setup": "workspace:*"
}
```

Xem chi tiết tại [docs/tooling/](../docs/tooling/).
