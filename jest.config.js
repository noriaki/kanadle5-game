const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js|jsx)',
    '**/src/**/*.(test|spec).(ts|tsx|js|jsx)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '\\.integration\\.(test|spec)\\.(ts|tsx|js|jsx)$',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid|@upstash|uncrypto)/)',
  ],
};

module.exports = createJestConfig(customJestConfig);