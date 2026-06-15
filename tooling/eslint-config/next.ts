import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import type { Linter } from 'eslint';

const reactHooksFlat = reactHooks.configs?.flat?.recommended ?? reactHooks.configs.recommended;

const tsx = (dirs: string[]) =>
  dirs.length ? dirs.map((d) => `${d}/**/*.{ts,tsx}`) : ['**/*.{ts,tsx}'];

/** Next.js applications preset config. */
export function nextPreset(dirs: string[] = []): Linter.Config[] {
  // Cast nextPlugin to any since its legacy v8 typing is incompatible with ESLint v9 Flat Config Linter.Config types
  const plugin = nextPlugin as any;
  return [
    {
      files: tsx(dirs),
      plugins: {
        ...reactHooksFlat.plugins,
        '@next/next': plugin,
      },
      languageOptions: {
        globals: {
          ...globals.browser,
          ...globals.node,
        },
        parserOptions: {
          projectService: true,
        },
      },
      rules: {
        ...reactHooksFlat.rules,
        ...plugin.configs.recommended.rules,
        ...plugin.configs['core-web-vitals'].rules,
      },
    } as any,
  ];
}
