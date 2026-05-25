# Prettier

Purpose: formatting baseline.

## Config

```json
{
  "singleQuote": true,
  "semi": true,
  "tabWidth": 2,
  "trailingComma": "all",
  "endOfLine": "lf",
  "arrowParens": "always"
}
```

## Commands

```bash
pnpm format
pnpm format:check
pnpm lint:fix
```

Generated, build, dependency, and cache folders are ignored through `.prettierignore`.
