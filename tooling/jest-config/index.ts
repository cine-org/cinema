import type { Config } from 'jest';

export function nestConfig(overrides: Config = {}): Config {
  return {
    moduleFileExtensions: ['js', 'json', 'ts'],
    rootDir: '.',
    testRegex: '\\.spec\\.ts$',
    transform: {
      '^.+\\.(t|j)s$': ['ts-jest', {}],
    },
    moduleNameMapper: {
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
    collectCoverageFrom: ['<rootDir>/src/**/*.(t|j)s'],
    coverageDirectory: '<rootDir>/coverage',
    testEnvironment: 'node',
    ...overrides,
  };
}
