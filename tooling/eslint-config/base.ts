import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import type { Linter } from 'eslint';

export const BASE_CONFIG: Linter.Config[] = [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.eslintcache',
      '**/generated/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/next-env.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierRecommended,
  {
    rules: {
      'prettier/prettier': 'off',
    },
  },
];

const ts = (dirs: string[]) => (dirs.length ? dirs.map((d) => `${d}/**/*.ts`) : ['**/*.ts']);

/** Pure-TS packages (packages/utils, packages/shared, …).
 *  No dirs → foundation only. With dirs → adds projectService scoped to those dirs. */
export function basePreset(dirs: string[] = []): Linter.Config[] {
  if (!dirs.length) return [...BASE_CONFIG];
  return [
    ...BASE_CONFIG,
    {
      files: ts(dirs),
      languageOptions: {
        parserOptions: {
          projectService: true,
        },
      },
    },
  ];
}
