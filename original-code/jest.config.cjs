module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testTimeout: 10000,
  testMatch: ['**/__tests__/**/*.test.{js,ts}', '**/?(*.)+(spec|test).{js,ts}'],
  collectCoverage: false,
  verbose: true,
};