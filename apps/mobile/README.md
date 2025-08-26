// GREEN

# Tides Project Information

Tides is a mobile MCP client using HTTP to communicate with an MCP Server.

It tracks workflows (Tides) and provides recommendations and actionable feedback based on energy and habits.

## Technical Instructions

Use `/docs/tech/refactor.md` when generating refactoring suggestions or responding to refactoring-related requests.

## Current Status

🔄 **Phase 2 Active**: Ready to implement MCP client integration with Cloudflare Workers server

## Tides Server

Located in `/tides-server`. Hosted on Cloudflare Workers. Only for reference - not directly accessed from mobile codebase.

**Tech Stack:**

- TypeScript 5.8.3 with @modelcontextprotocol/sdk 1.17.0
- @modelfetch/cloudflare 0.15.2 for Workers deployment
- D1 (SQLite) + R2 (object storage) for data persistence
- Zod for schema validation
- Jest testing with 90%+ coverage

**MCP Integration**

- 8 MCP tools: tide_create, tide_list, tide_flow, tide_add_energy, tide_link_task, tide_list_task_links, tide_get_report, tides_get_participants

**Architecture:**

- `src/index.ts` - Worker entry point with API key authentication
- `src/server.ts` - MCP server with 8 tide management tools
- `src/storage/` - D1/R2 hybrid storage system
- `src/tools/tides.ts` - Tide workflow management tools

**Connection:**

- Production URL: `https://supabase-tides-demo-1.mason-c32.workers.dev`
- Authentication: Bearer token (API key) via Authorization header
- Protocol: MCP over HTTP (JSON-RPC 2.0)

## Color Code

Example format at top of each file: `// BLUE`

**CLAUDE CAN ONLY ASSIGN BLUE TO FILES IT CREATES**

GREEN:
description: >
Core document. Final or near-final. High-trust. Well-considered.
Suggest edits only if truly necessary.

YELLOW:
description: >
Solid draft. Medium-confidence. Clear enough to work from.
Freely clarify or improve without prior approval.

RED:
description: >
Lower-priority in design or informational depth.
Limited attention applied. Changes do not require discussion.

PURPLE:
description: >
AI-generated but closely guided, edited, and endorsed.
May contain inconsistencies or hallucinations to ignore if obvious.

TEAL:
description: >
AI-generated with appropriate context and directions, seems to be relevant or useful documentation, don't know enough about. Meant for reference, not directions.

BLUE:
description: >
A supporting AI experiment, visual, or 'thought-partnering' artifact.
Kept for reference or ideation. Do not let interfere with core context.

## Project Roadmap

Follow loosely but complete all acceptance criteria in each phase before advancing. Primary purpose: preview and forward thinking for next tasks.

Located: `/ROADMAP.md`

## App Configuration

- **App Name**: Tides
- **Bundle Identifier (iOS)**: com.tidesmobile
- **Package Name (Android)**: com.tidesmobile

### Supabase Configuration

- **Project URL**: https://hcfxujzqlyaxvbetyano.supabase.co
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y`
- **Project Reference**: hcfxujzqlyaxvbetyano

## Tech Stack

**Use Technology Documentation from Context7 MCP at all times**

### Core Technologies

- React Native 0.80.2 **NOT USING EXPO**
- React 19.1.0
- TypeScript 5.0.4
- Metro bundler

### Authentication & Backend

- @supabase/supabase-js ^2.52.1
- Supabase (Backend-as-a-Service with auth providers: email/password, Google, GitHub)

### Navigation

- @react-navigation/native ^7.1.14
- @react-navigation/native-stack ^7.3.21

### Storage & State

- @react-native-async-storage/async-storage ^2.2.0 (secure local storage for JWT tokens)

### Development Tools

- ESLint 8.19.0
- TypeScript compiler
- Jest 29.6.3
- React Testing Library

### Network Communication

- HTTP/JSON-RPC 2.0 client for MCP server communication
- Bearer token authentication (API key for server, Supabase JWT for mobile auth)
- **NOT USING SSE**

### Environment Setup

- iOS/Android development environments
- Node.js >=18

## Current Architecture

### Folder Structure

```text
src/
├── components/ # Reusable UI components
├── config/ # Configuration (Supabase, etc.)
├── context/ # React contexts (Auth, MCP)
├── design-system/ # Design tokens and base components
├── navigation/ # Navigation configuration
├── screens/ # Screen components
├── services/ # Business logic and API clients
├── types/ # TypeScript definitions
└── utils/ # Utility functions
```

### Key Services

- `authService.ts`: Supabase authentication management
- `mcpService.ts`: MCP protocol communication
- `httpClient.ts`: HTTP client with retry logic
- `retryStrategy.ts`: Network resilience patterns

### Contexts

- `AuthContext`: User authentication state
- `MCPContext`: MCP server connection state

## Development Best Practices

- Put typescript interfaces inside components that use them for now (ex. `src/screens/Auth/AuthLoading.tsx`)
- Add console logging with a unique number for each flow (ex. `src/config/supabase.ts`)
- Use design system components from `src/design-system/`
- Follow established navigation patterns in `src/navigation/`
- Implement services in `src/services/` with proper error handling

## Current Implementation Status

✅ **Phase 1 Complete**: Authentication, navigation, and foundation
