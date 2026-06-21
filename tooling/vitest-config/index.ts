import { defineConfig, mergeConfig } from 'vitest/config';
import type { UserConfig } from 'vitest/config';

export function browserConfig(overrides: UserConfig = {}): UserConfig {
  return mergeConfig(
    defineConfig({
      test: {
        globals: true,
        environment: 'jsdom',
        css: true,
        include: [
          'test/**/*.spec.{ts,tsx}',
          'test/**/*.int-spec.{ts,tsx}',
          'test/**/*.e2e-spec.{ts,tsx}',
        ],
        coverage: {
          provider: 'v8',
          reporter: ['text', 'json', 'html'],
          exclude: [
            'node_modules/**',
            'dist/**',
            '.next/**',
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
        include: ['test/**/*.spec.ts', 'test/**/*.int-spec.ts', 'test/**/*.e2e-spec.ts'],
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
