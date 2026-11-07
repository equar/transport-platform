module.exports = {
  preset: 'jest-expo',
  watchman: false,
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
};