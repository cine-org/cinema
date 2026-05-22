import type { Linter } from 'eslint';

/** Config / tooling files — relaxed type rules. */
export function toolingPreset(dirs: string[] = []): Linter.Config[] {
  const files = ['**/*.config.{ts,mjs}', ...dirs.map((d) => `${d}/**/*.ts`)];
  return [
    {
      files,
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
      },
    },
  ];
}
