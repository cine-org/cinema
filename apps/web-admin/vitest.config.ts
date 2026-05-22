import react from '@vitejs/plugin-react';
import { browserConfig } from '@repo/vitest-config';

export default browserConfig({
  // Cast needed: @vitejs/plugin-react@6 targets vite@8 types, but vitest resolves vite@7 types
  plugins: [react()] as any,
  test: {
    setupFiles: ['@repo/test-setup/env', '@repo/test-setup/mocks'],
  },
});
