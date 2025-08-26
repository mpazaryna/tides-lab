# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Overview

For detailed release notes, see individual version files in the [docs/changelog/](docs/changelog/) directory.

## Versions

### Released Versions

- [v1.7.0 - 2025-08-11](docs/changelog/v1.7.0.md) - **Monorepo Integration & Package Management Migration**
  - Complete monorepo integration with shared API client and types
  - Migration from pnpm to npm package management
  - Wrangler configuration migration from TOML to JSONC format

- [v1.6.0 - 2025-08-07](docs/changelog/v1.6.0.md) - **Universal Agentic MCP Interface**
  - Complete agentic productivity platform for AI ecosystem
  - Fixed auth context propagation enabling multi-tenant agent access
  - Universal MCP interface for any AI client or agent integration
- [v1.4.0 - 2025-08-07](docs/changelog/v1.4.0.md) - **Raw JSON Export Tool & Enhanced Documentation**
  - New `tide_get_raw_json` MCP tool for complete data access
  - Comprehensive documentation updates (CONTRIBUTING.md, architecture.md)
  - Enhanced E2E test coverage with Raw JSON validation
- [v1.3.0 - 2025-08-06](docs/changelog/v1.3.0.md) - **Cloudflare Agents Implementation**
  - Complete autonomous agent system with HelloAgent
  - WebSocket support for real-time React Native features
  - Production-ready Durable Objects integration
- [v1.2.0 - 2025-08-05](docs/changelog/v1.2.0.md) - **Test Organization & Tool Architecture**
  - Refactored tools into domain-specific modules
  - Improved test organization (unit/integration/e2e)
  - Enhanced maintainability and scalability
- [v1.1.0 - 2025-08-05](docs/changelog/v1.1.0.md) - **Multi-Environment Deployment & Security**
  - Three-environment deployment (dev/staging/prod)
  - Enhanced D1/R2 storage architecture
  - Critical authentication security fixes
- [v1.0.0 - 2025-02-01](docs/changelog/v1.0.0.md) - **Complete Codebase Reorganization**
  - Modular architecture with organized folder structure
  - Comprehensive React Native integration documentation
  - Production-ready Cloudflare Workers deployment

### Upcoming Changes

- [Unreleased Changes](docs/changelog/unreleased.md) - Features and fixes in development

## Navigation

- **Latest Release**: [v1.7.0.md](docs/changelog/v1.7.0.md)
- **All Versions**: [docs/changelog/](docs/changelog/)
- **Changelog Directory**: [docs/changelog/README.md](docs/changelog/README.md)

## Quick Summary

**Current Status**: v1.7.0 (Released 2025-08-11)

- **11 MCP Tools** available across all environments
- **Production Deployments**: 3 environments (tides-001, tides-002, tides-003)
- **Test Coverage**: 158 E2E tests passing, comprehensive unit/integration coverage
- **Architecture**: Monorepo-integrated MCP server + Cloudflare Agents with D1/R2 storage
- **Package Management**: Standardized on npm across all applications

## Contributing

When adding changelog entries:

1. **During Development**: Update [unreleased.md](docs/changelog/unreleased.md)
2. **When Releasing**: Create new version file (e.g., `docs/changelog/v1.5.0.md`)
3. **After Release**: Update this index with the new version link
   For detailed contribution guidelines, see [CONTRIBUTING.md](CONTRIBUTING.md).

---

_For the complete development history and technical details, explore the individual version files in [docs/changelog/](docs/changelog/)._
