# Tooling

Shared development configuration packages. Root scripts invoke these packages through Turbo.

| Package                   | Used by                      | Purpose                                                     |
| ------------------------- | ---------------------------- | ----------------------------------------------------------- |
| `@repo/eslint-config`     | Entire repo                  | ESLint flat presets for Node, Next, JavaScript, and tooling |
| `@repo/typescript-config` | Entire repo                  | TypeScript presets: base, node, nest, next                  |
| `@repo/jest-config`       | Nest apps                    | Shared Jest and ts-jest configuration                       |
| `@repo/vitest-config`     | Next apps, modules, packages | Browser and Node Vitest configuration                       |

Tooling packages may build configuration code into `dist`, but they contain no production application logic.

See [docs/tooling](../docs/tooling/).
