# Tides Specifications

This folder contains specification documents for the Tides project following a spec-driven development approach.

## Documents

### [Migration Specification](./migration-spec.md)
Complete specification for migrating the Tides MCP server from Python FastMCP to TypeScript Cloudflare Workers. Includes:
- Architecture analysis and decisions
- Phase-by-phase migration plan
- Implementation details and patterns
- Testing and deployment strategies
- Current status and completion tracking

### [Setup Monitoring](./setup-monitoring.md)
Specification for implementing monitoring and observability for the Tides MCP server in production. Covers:
- Cloudflare Workers monitoring setup
- Alerting strategies
- Performance tracking
- Error monitoring

## Spec-Driven Development

These specifications serve as:
- **Design Documents**: Architectural decisions and implementation plans
- **Progress Tracking**: Current status and completion criteria
- **Reference Material**: Implementation patterns and best practices
- **Decision Records**: Why certain approaches were chosen over alternatives

## Contributing

When adding new features or making significant changes:
1. Create or update the relevant specification first
2. Use the spec to guide implementation
3. Update the spec with any changes during development
4. Mark phases/sections complete as they are finished