/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // TypeScript configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: false
    }]
  },
  
  // Module resolution
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  
  testMatch: [
    '<rootDir>/test/**/*.test.ts'
  ],
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/'
  ],
  
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ],
  
  coverageDirectory: 'coverage',
  
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  clearMocks: true,
  
  testTimeout: 10000
};