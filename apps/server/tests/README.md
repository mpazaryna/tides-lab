# Tides Test Suite Organization

This directory contains all tests for the Tides MCP server, organized by test type for better maintainability and execution control.

## 📁 Directory Structure

### `/unit/` - Unit Tests
Pure unit tests that test individual components in isolation without external dependencies.

- **`auth.test.ts`** - Authentication logic unit tests
- **`server.test.ts`** - MCP server unit tests  
- **`storage.test.ts`** - Storage interface and mock tests
- **`tides-tools.test.ts`** - Tide tool logic unit tests
- **`basic.test.ts`** - Basic functionality unit tests

**Characteristics:**
- Fast execution (< 1 second each)
- No network calls or external dependencies
- Use mocks/stubs for dependencies
- Test individual functions/classes

### `/integration/` - Integration Tests  
Tests that verify components work correctly together, including database and storage integrations.

- **`storage-integration.test.ts`** - Storage create/list workflows
- **`r2-storage.test.ts`** - R2 storage integration
- **`r2-rest-storage.test.ts`** - R2 REST API integration  
- **`multi-user-auth.test.ts`** - Multi-user authentication flows

**Characteristics:**
- Medium execution time (1-10 seconds each)
- May use test databases or storage
- Test component interactions
- Real implementations with test data

### `/e2e/` - End-to-End Tests
Full system tests that run against deployed environments to validate production readiness.

- **`health-check.test.ts`** - Complete environment health validation
- **`auth-check.test.ts`** - Security and authentication validation

**Characteristics:**
- Slower execution (10-30 seconds each)
- Test against real deployed environments
- Validate entire user workflows
- Critical for deployment validation

## 🚀 Running Tests

### Run All Tests
```bash
npm test                    # All tests
npm run test:coverage       # All tests with coverage
npm run test:ci            # CI/CD optimized run
```

### Run by Category
```bash
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only  
npm run test:e2e          # End-to-end tests only
```

### Watch Mode
```bash
npm run test:watch         # Watch all tests
npm run test:unit:watch    # Watch unit tests only
npm run test:integration:watch  # Watch integration tests only
```

### Run Specific Tests
```bash
npm test -- auth.test.ts                    # Specific file
npm test -- tests/unit                      # Specific directory
npm test -- --testNamePattern="auth"        # By test name pattern
```

## 🎯 Test Guidelines

### Unit Tests
- Should be fast and isolated
- Mock external dependencies
- Focus on single responsibility
- Aim for 100% code coverage

### Integration Tests  
- Test real component interactions
- Use test data/environments
- Validate data flows between components
- Test error handling and edge cases

### End-to-End Tests
- Test complete user scenarios
- Run against deployed environments
- Validate security and performance
- Critical for release validation

## 📊 Coverage Requirements

We maintain high test coverage standards:
- **Unit Tests**: Target 95%+ coverage
- **Integration Tests**: Focus on critical workflows  
- **E2E Tests**: Validate production scenarios

## 🔧 Adding New Tests

When adding new tests, place them in the appropriate directory:

1. **Unit tests** → `/unit/` - Testing individual functions/classes
2. **Integration tests** → `/integration/` - Testing component interactions
3. **E2E tests** → `/e2e/` - Testing complete user workflows

Follow existing naming conventions: `feature-name.test.ts`