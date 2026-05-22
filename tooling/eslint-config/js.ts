import globals from 'globals';
import tseslint from 'typescript-eslint';
import type { Linter } from 'eslint';

const js = (dirs: string[]) =>
  dirs.length ? dirs.map((d) => `${d}/**/*.{js,cjs,mjs}`) : ['**/*.{js,cjs,mjs}'];

/** All JS / CJS / MJS files — type-checking disabled. */
export function javascriptPreset(dirs: string[] = []): Linter.Config[] {
  return [
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
