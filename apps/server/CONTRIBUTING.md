# Contributing to Tides

Thank you for your interest in contributing to Tides! This guide will help you get started with development, testing, and submitting contributions.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (free tier works)
- Wrangler CLI (installed via npm)

### Getting Started

```bash
# Clone the repository
git clone https://github.com/yourusername/tides.git
cd tides

# Install dependencies
npm install

# Generate TypeScript types
npm run types

# Start development server
npm run dev
```

## Code Organization

### Directory Structure

```
src/
├── index.ts          # Main Worker entry point & agent routing
├── server.ts         # MCP server implementation
├── auth/             # Authentication logic
├── db/               # Database schemas and migrations
├── storage/          # Storage implementations (D1, R2)
├── tools/            # MCP tool implementations
│   ├── tide-core.ts      # Core tide operations
│   ├── tide-sessions.ts  # Flow session management
│   ├── tide-tasks.ts     # External task integration
│   └── tide-analytics.ts # Reporting and analytics
agents/               # Durable Object agents
├── hello/           # Example agent implementation
└── [new-agent]/     # Your new agent here
tests/               # Test suites
├── unit/            # Fast, isolated unit tests
├── integration/     # Component interaction tests
├── e2e/            # End-to-end tests
└── agents/         # Agent-specific tests
```

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

Follow the existing code patterns and conventions:

- TypeScript with strict mode
- Async/await for asynchronous operations
- Zod schemas for validation
- Comprehensive error handling

### 3. Write Tests

Every new feature should include tests:

```bash
# Run all tests
npm run test

# Run specific test categories
npm run test:unit
npm run test:integration
npm run test:e2e

# Watch mode during development
npm run test:watch
```

### 4. Test Coverage

We maintain high test coverage standards:

- Unit tests: 95%+ coverage
- Integration tests: Critical workflows
- E2E tests: Production scenarios

Check coverage:

```bash
npm run test:coverage
```

## Creating New Agents

Agents are Durable Objects that provide autonomous functionality:

### 1. Create Agent Structure

```typescript
// agents/your-agent/agent.ts
export class YourAgent implements DurableObject {
  constructor(
    private state: DurableObjectState,
    private env: Env
  ) {}

  async fetch(request: Request): Promise<Response> {
    // Handle REST and WebSocket requests
  }
}

// agents/your-agent/index.ts
export { YourAgent } from "./agent";
```

### 2. Register in Worker

```typescript
// src/index.ts
export { YourAgent } from "../agents/your-agent";

// Add routing case
case 'your-agent':
  const agentId = env.YOUR_AGENT.idFromName(userId);
  return env.YOUR_AGENT.get(agentId).fetch(agentRequest);
```

### 3. Update Configuration

```toml
# wrangler.toml
[[durable_objects.bindings]]
name = "YOUR_AGENT"
class_name = "YourAgent"
```

### 4. Write Agent Tests

```typescript
// tests/agents/your-agent.test.ts
describe("YourAgent", () => {
  // Test REST endpoints
  // Test WebSocket functionality
  // Test state persistence
});
```

## Testing Guidelines

### Unit Tests

- Mock external dependencies
- Test individual functions
- Focus on edge cases
- Use descriptive test names

### Integration Tests

- Test component interactions
- Use test databases
- Validate data flows
- Test error scenarios

### E2E Tests

- Test complete workflows
- Run against deployed environments
- Validate production readiness
- Test multi-user scenarios

### Running Agent Tests

```bash
# Test specific agent
npm run test tests/agents/hello.test.ts

# E2E test against deployed agent
curl https://tides-001.mpazbot.workers.dev/agents/hello/hello
```

## Code Style

### TypeScript

- Use strict mode
- Prefer const over let
- Use async/await over promises
- Add types for all parameters and returns

### Naming Conventions

- Files: kebab-case (`tide-core.ts`)
- Classes: PascalCase (`TideAgent`)
- Functions: camelCase (`createTide`)
- Constants: UPPER_SNAKE_CASE (`MAX_RETRIES`)

### Documentation

- Add JSDoc comments for public APIs
- Include examples in complex functions
- Document agent endpoints
- Update README for new features

## Submitting Changes

### 1. Commit Messages

Follow conventional commit format:

```
feat: add new tide scheduling agent
fix: resolve WebSocket reconnection issue
docs: update agent creation guide
test: add integration tests for flow sessions
```

### 2. Push Your Branch

```bash
git push origin feature/your-feature-name
```

### 3. Create Pull Request

- Provide clear description
- Reference any related issues
- Include test results
- Update documentation

### 4. PR Checklist

- [ ] Tests pass (`npm run test`)
- [ ] Coverage maintained
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No hardcoded secrets

## Deployment

### Local Testing

```bash
npm run dev
```

### Deploy to Environment

```bash
# Deploy to development
npm run deploy

# Deploy specific environment
wrangler deploy --env production
```

### Monitor Deployment

```bash
# View logs
npm run monitor:live

# Check metrics
npm run monitor

# Health check
curl https://tides-001.mpazbot.workers.dev/health
```

## Getting Help

- Check existing [issues](https://github.com/yourusername/tides/issues)
- Review [documentation](docs/)
- Ask in discussions
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the project's license.
