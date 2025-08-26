# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tides is an MCP (Model Context Protocol) server built with ModelFetch for Cloudflare Workers. It provides a standardized way for AI models to interact with external systems through tools, resources, and prompts.

## Essential Commands

**Development:**

```bash
npm run dev    # Start development server using Wrangler (logs to ./logs/)
```

**Testing:**

```bash
npm run test              # Run Jest tests
npm run test:watch        # Run tests in watch mode
npm run test:coverage     # Run tests with coverage reporting
npm run test:ci           # Run tests for CI (no watch)
```

**Deployment:**

```bash
npm run deploy # Deploy to Cloudflare Workers using proper npm script
npm run delete # Remove deployed resources from Cloudflare
```

**Development Testing:**

```bash
npx wrangler deploy --dry-run # Test deployment configuration without deploying
```

**Monitoring:**

```bash
npm run monitor:simple        # Basic worker status check (always works)
npm run monitor:live          # Real-time log streaming
npm run monitor               # Full analytics (requires API permissions)
npm run monitor:alerts        # Automated health monitoring
```

## Architecture

The codebase follows a clean serverless architecture:

- `src/index.ts` - Cloudflare Worker entry point that handles HTTP requests
- `src/server.ts` - Core MCP server implementation with example tools, resources, and prompts
- Uses `@modelcontextprotocol/sdk` for MCP functionality
- Built on `@modelfetch/cloudflare` for Workers integration
- Zod schemas for input validation and type safety

## MCP Implementation Patterns

The server demonstrates three core MCP capabilities:

1. **Tools** (executable functions): See `roll_dice` example - use for actions LLMs can invoke
2. **Resources** (data/content): See `app_config` example - use for exposing information to LLMs
3. **Prompts** (reusable templates): See `review_code` example - use for standardized prompt patterns

When adding new MCP functionality, follow the existing patterns in `src/server.ts` for registration and implementation.

## Key Dependencies

- **MCP SDK**: `@modelcontextprotocol/sdk` - Core protocol implementation
- **ModelFetch**: `@modelfetch/cloudflare` - Cloudflare Workers integration
- **Zod**: Schema validation and TypeScript type generation
- **Wrangler**: Cloudflare Workers deployment tool

## Development Documentation Access

Use Context7 to access comprehensive Cloudflare documentation throughout this project:

**Primary Documentation Sources:**

- Use library ID `/llmstxt/developers_cloudflare_com-workers-llms-full.txt` for complete Cloudflare Workers documentation
- Use library ID `/cloudflare/mcp-server-cloudflare` for production MCP server patterns and implementations
- Use library ID `/cloudflare/workers-sdk` for Wrangler CLI and tooling guidance
- Use library ID `/context7/developers_cloudflare-workers` for platform-specific documentation

**When to Use Context7:**

- Implementing MCP tools (follow production server patterns from `/cloudflare/mcp-server-cloudflare`)
- Deployment and configuration questions (reference Workers documentation)
- Performance optimization and best practices
- Authentication and security implementation
- Storage patterns (KV, R2, D1 usage examples)

**Example Context7 Usage:**

```
Can you use Context7 to get the latest Cloudflare Workers deployment patterns for MCP servers?
```

## Testing

The project includes comprehensive Jest tests with 90%+ coverage requirements:

- **Test Structure**: Tests are located in `tests/` directory
- **Coverage**: Configured for high coverage thresholds (90%+ for all metrics)
- **Integration Focus**: Tests go through `index.ts` as the main entry point
- **ESM Support**: Uses `ts-jest` with ES modules support

Test files:

- `tests/index.test.ts` - Tests for the Cloudflare Worker entry point
- `tests/server.test.ts` - Tests for MCP server functionality

## Configuration

- TypeScript with strict mode enabled, ES2022 target
- ES modules (`"type": "module"`)
- Cloudflare Workers compatibility date: 2025-06-17
- Uses npm as package manager
- Jest configured with TypeScript and ESM support
