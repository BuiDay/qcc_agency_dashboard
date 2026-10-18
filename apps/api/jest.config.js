module.exports = {
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@qcc/shared$': '<rootDir>/../../packages/shared/dist',
  },
};
