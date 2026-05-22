import { nestConfig } from '@repo/jest-config';

export default nestConfig({
  moduleNameMapper: {
    '^@repo/(.*)$': '<rootDir>/../packages/$1/src',
  },
});
