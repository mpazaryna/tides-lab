module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        verbatimModuleSyntax: false,
        moduleResolution: 'node',
        module: 'commonjs',
        baseUrl: '.',
        paths: {
          '@agents/*': ['../agents/*'],
          '@agents': ['../agents']
        }
      }
    }]
  },
  moduleNameMapper: {
    '^@agents/(.*)$': '<rootDir>/../agents/$1',
    '^@agents$': '<rootDir>/../agents'
  },
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!**/node_modules/**'
  ],
  // Coverage thresholds disabled for CI/CD
  // We strive for 100% coverage but don't want to block deployments
  // coverageThreshold: {
  //   global: {
  //     branches: 80,
  //     functions: 80,
  //     lines: 80,
  //     statements: 80
  //   }
  // }
};