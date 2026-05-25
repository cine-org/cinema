import { nestConfig } from '@repo/jest-config';

export default nestConfig({
  moduleNameMapper: {
    '^@repo/shared$': '<rootDir>/../../modules/shared',
    '^@repo/(.*)$': '<rootDir>/../../packages/$1/src',
  },
});
