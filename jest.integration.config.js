const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.integration.setup.js'],
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/integration/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/src/**/*.integration.(test|spec).(ts|tsx|js|jsx)',
  ],
  testTimeout: 30000, // 30 seconds for integration tests
  maxWorkers: 1, // Run integration tests sequentially to avoid conflicts
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|@upstash/redis|uncrypto)/)',
  ],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};

module.exports = createJestConfig(customJestConfig);