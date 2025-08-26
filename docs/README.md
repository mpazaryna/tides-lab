# Tides Documentation

Comprehensive documentation for the Tides MCP ecosystem.

## Quick Start

- **New to Tides?** Start with [What is Tides?](core/what-is-tides.md)
- **Setting up development?** See [Development Guide](core/development.md)
- **Understanding the system?** Read [Architecture Overview](core/architecture.md)
- **API Reference?** Check [API Documentation](core/api-reference.md)

## Documentation Structure

### 📁 Core Documentation (`core/`)

Essential project documentation and getting started guides.

- [`what-is-tides.md`](core/what-is-tides.md) - Project vision and philosophy
- [`architecture.md`](core/architecture.md) - System architecture overview
- [`development.md`](core/development.md) - Development setup and workflow
- [`api-reference.md`](core/api-reference.md) - Complete API documentation

### 🔐 Authentication (`auth/`)

Authentication and security documentation.

- [`hybrid-auth-system.md`](auth/hybrid-auth-system.md) - Cross-client authentication spec
- [`mobile-mcp-auth-flow.md`](auth/mobile-mcp-auth-flow.md) - Mobile authentication flow
- [`auth-specs.md`](auth/auth-specs.md) - Authentication specifications

### 📱 Mobile App (`mobile/`)

Mobile app specific documentation.

- [`ux/flows/`](mobile/ux/flows/) - User experience flow documentation
- [`ux/guides/`](mobile/ux/guides/) - User interface guides

### 📋 Technical Specifications (`specs/`)

Detailed technical specifications and requirements.

- [`gherkin.md`](specs/gherkin.md) - BDD test specifications
- [`tools-auth-setup.md`](specs/tools-auth-setup.md) - Tool authentication setup
- [`react-native-cloudflare-architecture.md`](specs/react-native-cloudflare-architecture.md) - RN/CF architecture

### 🏗️ Architecture Decisions (`decisions/`)

Architecture Decision Records (ADRs) documenting key technical choices.

- [`001-mcp-session-storage.md`](decisions/001-mcp-session-storage.md) - MCP session storage strategy
- [`002-tide-data-storage.md`](decisions/002-tide-data-storage.md) - Tide data storage format
- [`003-hierarchical-tide-context.md`](decisions/003-hierarchical-tide-context.md) - Hierarchical tide context system

### 🔄 Workflows (`workflows/`)

Process and workflow documentation.

- [`how-tides-work.md`](workflows/how-tides-work.md) - How tides and flows function
- [`agent-communication-flow.md`](workflows/agent-communication-flow.md) - Agent communication patterns

### 📦 Archive (`archive/`)

Outdated or deprecated documentation kept for historical reference.

- Contains legacy documentation, old specifications, and deprecated guides
- Reference only - not maintained for current system

## Navigation Tips

### By Audience

**🆕 New Contributors**

1. [What is Tides?](core/what-is-tides.md)
2. [Architecture Overview](core/architecture.md)
3. [Development Guide](core/development.md)

**🏗️ Architects & Leads**

1. [Architecture Overview](core/architecture.md)
2. [Architecture Decisions](decisions/)
3. [Technical Specifications](specs/)

**📱 Mobile Developers**

1. [Mobile Documentation](mobile/)
2. [Authentication Flow](auth/mobile-mcp-auth-flow.md)
3. [Development Guide](core/development.md)

**🖥️ Backend Developers**

1. [API Reference](core/api-reference.md)
2. [Authentication System](auth/hybrid-auth-system.md)
3. [Architecture Decisions](decisions/)

**🔧 DevOps & Infrastructure**

1. [Architecture Overview](core/architecture.md)
2. [Authentication System](auth/hybrid-auth-system.md)
3. [Development Guide](core/development.md)

### By Task

**Setting up development environment:**
→ [Development Guide](core/development.md)

**Understanding authentication:**  
→ [Authentication Documentation](auth/)

**Making architectural decisions:**
→ [Architecture Decisions](decisions/)

**Implementing new features:**
→ [API Reference](core/api-reference.md) + [Specifications](specs/)

**Troubleshooting issues:**
→ [Workflows](workflows/) + [Archive](archive/) (for historical context)

## Contributing to Documentation

When adding new documentation:

1. **Core concepts** → `core/`
2. **Auth/security** → `auth/` 
3. **Mobile-specific** → `mobile/`
4. **Technical specs** → `specs/`
5. **Major decisions** → `decisions/` (as ADR)
6. **Process docs** → `workflows/`
7. **Deprecated** → `archive/`

### Documentation Standards

- Use kebab-case for file names
- Include clear descriptions and examples
- Cross-reference related documents
- Update this README when adding new major sections
- Keep paths up to date with monorepo structure (`apps/mobile/`, `apps/server/`)

## Getting Help

- **General questions:** Start with [What is Tides?](core/what-is-tides.md)
- **Technical issues:** Check [Development Guide](core/development.md)
- **API questions:** See [API Reference](core/api-reference.md)
- **Architecture questions:** Review [Architecture Overview](core/architecture.md) and [Decisions](decisions/)

For additional support, check the project's main README or contact the development team.