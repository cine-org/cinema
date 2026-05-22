import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import type { Linter } from 'eslint';

const reactHooksFlat = reactHooks.configs?.flat?.recommended ?? reactHooks.configs.recommended;

const tsx = (dirs: string[]) =>
  dirs.length ? dirs.map((d) => `${d}/**/*.{ts,tsx}`) : ['**/*.{ts,tsx}'];

/** React / Vite apps and UI packages. */
export function reactPreset(dirs: string[] = []): Linter.Config[] {
  return [
    {
      files: tsx(dirs),
      plugins: {
        ...reactHooksFlat.plugins,
        'react-refresh': reactRefresh,
      },
      languageOptions: {
        globals: {
          ...globals.browser,
        },
        parserOptions: {
          projectService: true,
        },
      },
      rules: {
        ...reactHooksFlat.rules,
        'react-refresh/only-export-components': [
          'warn',
          {
            allowConstantExport: true,
          },
        ],
      },
    },
  ];
}
