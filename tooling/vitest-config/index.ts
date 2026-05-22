import { defineConfig, mergeConfig } from 'vitest/config';
import type { UserConfig } from 'vitest/config';

export function browserConfig(overrides: UserConfig = {}): UserConfig {
  return mergeConfig(
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        css: true,
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            'public/**',
            'prisma/**',
            '**/generated/**',
            '**/*.config.*',
            '**/*.d.ts',
          ],
        },
      },
    }),
    overrides,
  );
}

export function nodeConfig(overrides: UserConfig = {}): UserConfig {
  return mergeConfig(
    defineConfig({
      test: {
        globals: true,
        environment: 'node',
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            'prisma/**',
            '**/generated/**',
            '**/*.config.*',
            '**/*.d.ts',
          ],
        },
      },
    }),
    overrides,
  );
}
