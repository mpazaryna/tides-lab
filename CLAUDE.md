# Tides Monorepo Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working with the Tides monorepo.

## Project Overview

**Tides** is a comprehensive MCP (Model Context Protocol) ecosystem consisting of:

- **MCP Server** (`apps/server/`): Cloudflare Workers-based server providing standardized AI model interactions
- **Mobile App** (`apps/mobile/`): React Native client for energy-based workflow tracking
- **Architecture**: Mobile App → HTTP/JSON-RPC 2.0 → MCP Server → Supabase/Cloudflare Storage

## Monorepo Structure

```
tides/
├── apps/
│   ├── agents/         # Shared agent implementations (hello, tide-productivity-agent)
│   ├── server/         # Cloudflare Workers MCP server (pnpm)
│   ├── mobile/         # React Native mobile app (npm)
│   ├── web/            # Next.js 15.4.3 frontend (npm)
│   └── supabase-tides-demo-1/  # Vitest-based testing app (npm)
├── docs/               # Architecture docs, ADRs, specs, UX flows
├── refactor/           # Refactoring progress tracking
├── scripts/            # Root-level development scripts
├── shared/             # Shared TypeScript types and utilities
└── CLAUDE.md           # This file
```

## Essential Commands

### Development

```bash
# Root development (all apps)
npm run dev                       # Start all development servers concurrently

# Individual app development
npm run dev:server               # Server: Wrangler dev server (pnpm)
npm run dev:mobile               # Mobile: React Native metro bundler (npm)
npm run dev:web                  # Web: Next.js dev server (npm)

# Direct commands
cd apps/server && pnpm run dev    # Start Wrangler dev server
cd apps/mobile && npm start       # Start React Native metro bundler
cd apps/web && npm run dev        # Start Next.js dev server
cd apps/supabase-tides-demo-1 && npm run dev  # Testing app dev server
```

### Testing

```bash
# Root testing (all apps)
npm run test                      # Run all tests across server, mobile, web

# Individual app testing
npm run test:server              # Server Jest tests (pnpm)
npm run test:mobile              # Mobile Jest tests (npm)
npm run test:web                 # Web tests (npm)

# Direct commands
cd apps/server && pnpm run test              # Run Jest tests
cd apps/server && pnpm run test:coverage     # Run with coverage
cd apps/mobile && npm test                   # Run mobile tests
cd apps/supabase-tides-demo-1 && npm test   # Run Vitest tests
```

### Deployment

```bash
# Root deployment
npm run build                     # Build server and web apps
npm run build:server             # Deploy server to Cloudflare Workers
npm run build:web                # Build web app
npm run build:mobile:android     # Build Android mobile app
npm run build:mobile:ios         # Build iOS mobile app

# Server deployment
cd apps/server && pnpm run deploy           # Deploy to Cloudflare Workers
cd apps/server && pnpm run delete           # Remove deployed resources

# Environment-specific deployments (apps/server)
pnpm run deploy:prod             # Deploy to env.001 (production)
pnpm run deploy:staging          # Deploy to env.002 (staging)
pnpm run deploy:dev              # Deploy to env.003 (development)

# Server monitoring
npm run server:monitor           # Basic server status check (root)
cd apps/server && pnpm run monitor:simple   # Basic status check
cd apps/server && pnpm run monitor:live     # Real-time logs
cd apps/server && pnpm run monitor          # Full analytics
```

## Technology Stack

### Server (apps/server/)

- **Runtime**: Cloudflare Workers
- **Framework**: ModelFetch (`@modelfetch/cloudflare`)
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Validation**: Zod schemas
- **Testing**: Jest with 90%+ coverage
- **Package Manager**: pnpm

### Mobile (apps/mobile/)

- **Framework**: React Native 0.80.2 (NO EXPO)
- **React Version**: 19.1.0
- **Language**: TypeScript 5.0.4
- **Backend**: Supabase authentication & storage
- **Navigation**: React Navigation v7
- **Storage**: AsyncStorage
- **Package Manager**: npm

### Web Dependencies (apps/web)

- `next@15.4.3` - Next.js framework
- `react@19.1.0` - React framework
- `react-dom@19.1.0` - React DOM bindings
- `typescript@^5` - TypeScript compiler
- `eslint@^9` - ESLint linter
- `eslint-config-next@15.4.3` - Next.js ESLint config

### Supabase Demo Dependencies (apps/supabase-tides-demo-1)

- `wrangler@^4.28.1` - Cloudflare Workers CLI
- `vitest@~3.2.0` - Testing framework
- `@cloudflare/vitest-pool-workers@^0.8.19` - Workers testing integration
- `typescript@^5.5.2` - TypeScript compiler

## Architecture & Integration

### MCP Server Implementation

**Entry Points:**

- `apps/server/src/index.ts` - Cloudflare Worker HTTP handler
- `apps/server/src/server.ts` - Core MCP server with tools/resources/prompts

**MCP Capabilities:**

1. **Tools** (executable functions): `roll_dice` example
2. **Resources** (data/content): `app_config` example
3. **Prompts** (reusable templates): `review_code` example

### Mobile-Server Communication

**Protocol**: MCP over HTTP (JSON-RPC 2.0)
**Authentication**: Hybrid Bearer token system:

- Mobile clients: `Bearer tides_{userId}_{randomId}` (custom API keys)
- Desktop clients: `Bearer {uuid}` (UUID tokens)
- Cross-client data isolation maintained

**Available MCP Tools:**

1. `tide_create` - Create new tide workflows
2. `tide_list` - List existing tides
3. `tide_flow` - Manage tide flow states
4. `tide_add_energy` - Add energy measurements
5. `tide_link_task` - Link tasks to tides
6. `tide_list_task_links` - List task linkages
7. `tide_get_report` - Generate tide reports
8. `tides_get_participants` - Get tide participants

## Configuration

### Supabase (Mobile Backend)

- **Project URL**: `https://hcfxujzqlyaxvbetyano.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y`
- **Project Reference**: hcfxujzqlyaxvbetyano

### Mobile App Identifiers

- **App Name**: Tides (package name: TidesMobile)
- **iOS Bundle ID**: com.tidesmobile
- **Android Package**: com.tidesmobile
- **Xcode Project**: TidesMobile.xcodeproj
- **iOS Target**: TidesMobile

### Cloudflare Workers

- **Compatibility Date**: 2025-06-17
- **Environment Configuration**:
  - **env.001**: Development environment → `tides-001.mpazbot.workers.dev`
  - **env.002**: Staging environment → `tides-002.mpazbot.workers.dev`
  - **env.003**: Production environment → `tides-003.mpazbot.workers.dev`
  - **Custom**: User-configurable server URL
- **Default**: Development environment selected on first launch
- **Note**: Server version shows 1.6.0 in package.json but uses 0.0.1 in runtime

## Development Guidelines

### Before Starting Any Task

**ALWAYS use Context7 MCP for technology documentation:**

**Context7 Library IDs:**

- Complete Cloudflare Workers: `/llmstxt/developers_cloudflare_com-workers-llms-full.txt`
- MCP server patterns: `/cloudflare/mcp-server-cloudflare`
- Wrangler CLI: `/cloudflare/workers-sdk`
- React Native: `/facebook/react-native-website`
- Supabase: `/supabase/supabase`
- TypeScript: `/microsoft/typescript`
- React Navigation: `/react-navigation/react-navigation.github.io`

### Code Standards

**Server:**

- Follow MCP patterns in `src/server.ts` for tools/resources/prompts
- Use Zod schemas for validation
- Maintain 90%+ test coverage
- ES modules with strict TypeScript

**Mobile:**

- NO Expo dependencies - pure React Native only
- Place TypeScript interfaces inside components
- Use design system components from `src/design-system/`
- Implement retry logic for network requests
- Store authentication state in AsyncStorage
- Avoid using useCallback

### Database Development Status

- **Current Status**: Development phase - structure is flexible
- **Modification Policy**: Feel free to modify tables, schemas, or data
- **Priority**: JSONB data handling over complex enterprise solutions

## Development Workflow

1. **Query Context7 MCP** before implementing technology-specific features
2. **Choose workspace**: Navigate to appropriate app directory (`apps/server/`, `apps/mobile/`, `apps/web/`, `apps/supabase-tides-demo-1/`)
3. **Follow established patterns** in existing codebase
4. **Test authentication flows** thoroughly (hybrid system)
5. **Verify MCP communication** between mobile and server
6. **Run linting/testing** before committing
7. **Use root scripts** for cross-app operations (`npm run dev`, `npm run test`, `npm run build`)
8. **Respect package manager boundaries** (npm for most apps, check individual app package.json)

## Key Dependencies

### Server Dependencies (apps/server)

- `@modelcontextprotocol/sdk@1.17.0` - MCP protocol implementation
- `@modelfetch/cloudflare@0.15.2` - Workers integration
- `zod@3.25.76` - Schema validation
- `wrangler@4.26.0` - Deployment tooling
- `jest@30.0.5` - Testing framework
- `typescript@5.8.3` - TypeScript compiler
- `tslib@2.8.1` - TypeScript runtime library

### Mobile Dependencies (apps/mobile)

- `@supabase/supabase-js@2.52.1` - Backend integration
- `@react-navigation/native@7.1.14` - Navigation framework
- `@react-navigation/native-stack@7.3.21` - Stack navigator
- `@react-native-async-storage/async-storage@2.2.0` - Local storage
- `react@19.1.0` - React framework
- `react-native@0.80.2` - React Native framework
- `react-native-keychain@10.0.0` - Secure storage
- `react-native-gesture-handler@2.27.2` - Touch gestures (dev dependency)
- `react-native-safe-area-context@5.5.2` - Safe area handling
- `react-native-screens@4.13.1` - Native screen components
- `typescript@5.0.4` - TypeScript compiler

### Package Manager Strategy

- **Server (apps/server)**: pnpm (NO lock file found - uses npm)
- **Mobile (apps/mobile)**: npm (confirmed via package-lock.json)
- **Web (apps/web)**: npm (confirmed via package-lock.json)
- **Supabase Demo (apps/supabase-tides-demo-1)**: npm (confirmed via package-lock.json)
- **Root**: npm (confirmed via package-lock.json)
- **Shared Agents (apps/agents)**: No package.json - shared code

**Note**: Documentation previously mentioned pnpm for server, but actual structure uses npm throughout.

## Current Development Status

### Completed

- ✅ Monorepo structure established
- ✅ Server MCP foundation with example tools/resources/prompts
- ✅ Mobile authentication system with Supabase
- ✅ Hybrid authentication (mobile + desktop client support)
- ✅ Navigation framework implemented

### Active Development

- **Primary Focus**: Full integration of 8 tide tools from reference server
- **Authentication**: Hybrid system deployment optimization
- **Storage**: JSONB data handling and scalable patterns
- **Architecture**: Maintain proof-of-concept approach over enterprise complexity

### Next Phase

- Complete MCP integration with tide workflow management
- Optimize cross-client data isolation
- Implement all 8 tide tools in primary server
- Desktop setup with UUID export and QR code generation

## Critical Requirements

### Always Required

1. **Query Context7 MCP** before implementing any technology features
2. **Test hybrid authentication** (mobile + desktop flows)
3. **Implement proper error handling** for all network requests
4. **Follow workspace-specific patterns** (server vs mobile vs web conventions)
5. **Maintain authentication state** across app restarts
6. **Support cross-client compatibility** for data access
7. **Use appropriate package manager** (check individual app's package.json)
8. **Respect monorepo structure** - use root scripts for cross-app operations

### Storage Strategy

- **Priority**: JSONB data handling over R2 storage complexity
- **Focus**: Scalable, simple solutions rather than enterprise complexity
- **Goal**: Efficient data flow for tide workflow management

## Resources & References

- **Server Details**: See `apps/server/CLAUDE.md` for complete server documentation
- **Mobile Details**: See `apps/mobile/CLAUDE.md` for complete mobile documentation
- **Context7 Access**: Available for all technology documentation needs
- **Authentication**: Working Supabase JWT integration with Cloudflare Workers

## Monorepo Setup

### Source Repositories:

- **MCP Server:** https://github.com/mpazaryna/tides-server (Cloudflare Workers, npm)
- **Mobile App:** https://github.com/masonomara/TidesMobile (React Native 0.80.2, npm)
- **Web App:** https://github.com/masonomara/tides-app-bare (Next.js 15.4.3, npm)

### Additional Structure:

- **Shared Agents:** `apps/agents/` - Common agent implementations (hello, tide-productivity-agent)
- **Documentation:** `docs/` - ADRs, specs, UX flows, architecture
- **Development Tools:** Root-level scripts for cross-app development workflows
- **Testing App:** `apps/supabase-tides-demo-1/` - Vitest-based Cloudflare Workers testing

**Target Architecture:** Multi-platform monorepo with independent dependency trees to avoid React Native Metro bundler conflicts. Unified development experience through root-level scripts while maintaining app isolation.
