import { browserConfig } from '@repo/vitest-config';

export default browserConfig({
  test: {
    setupFiles: ['@repo/test-setup/env', '@repo/test-setup/mocks'],
  },
});
