/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.tsx',
    '!src/**/*.d.ts',
    '!src/shared/env.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 85,
    },
  },
  forceExit: true,
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: false,
        diagnostics: false,
      },
    ],
  },
};
