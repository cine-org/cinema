import globals from 'globals';
import tseslint from 'typescript-eslint';
import type { Linter } from 'eslint';

const ts = (dirs: string[]) => (dirs.length ? dirs.map((d) => `${d}/**/*.ts`) : ['**/*.ts']);
const js = (dirs: string[]) =>
  dirs.length ? dirs.map((d) => `${d}/**/*.{js,cjs,mjs}`) : ['**/*.{js,cjs,mjs}'];

/** Node / NestJS apps and packages. */
export function nodePreset(dirs: string[] = []): Linter.Config[] {
  return [
    {
      files: ts(dirs),
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.jest,
        },
        parserOptions: {
          projectService: {
            allowDefaultProject: ['packages/*/prisma/*.ts', 'packages/*/prisma/seeds/*.ts'],
          },
        },
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-floating-promises': 'warn',
        '@typescript-eslint/no-unsafe-assignment': 'warn',
        '@typescript-eslint/no-unsafe-return': 'warn',
        '@typescript-eslint/no-unused-vars': [
          'warn',
          {
            argsIgnorePattern: '^_',
            varsIgnorePattern: '^_',
            caughtErrorsIgnorePattern: '^_',
          },
        ],
      },
    },
    {
      files: ['packages/*/*.config.ts', 'modules/*/*.config.ts', 'tooling/*/*.config.ts'],
      languageOptions: {
        parserOptions: {
          projectService: false,
        },
      },
      rules: {
        ...tseslint.configs.disableTypeChecked.rules,
      },
    },
    {
      files: js(dirs),
      languageOptions: {
        globals: {
          ...globals.node,
          ...globals.commonjs,
        },
        parserOptions: {
          projectService: false,
        },
      },
      rules: {
        ...tseslint.configs.disableTypeChecked.rules,
        '@typescript-eslint/no-require-imports': 'off',
      },
    },
  ];
}
