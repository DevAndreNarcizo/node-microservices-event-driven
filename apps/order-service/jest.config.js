/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@portfolio/contracts$':
      '<rootDir>/../../packages/contracts/src/index.ts',
  },
  testMatch: ['**/*.spec.ts'],
};
