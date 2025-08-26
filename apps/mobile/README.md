// GREEN

# Tides Mobile

React Native MCP client for workflow tracking.

## Status

✅ Production ready MCP client
✅ Full server integration

## Server

**Location:** `/tides-server` (reference only)
**URL:** `https://supabase-tides-demo-1.mason-c32.workers.dev`
**Protocol:** JSON-RPC 2.0 over HTTP
**Auth:** Bearer token
**Tools:** 8 tide management functions

## File Colors

**GREEN:** Final/core documents
**YELLOW:** Solid drafts
**RED:** Lower priority
**PURPLE:** AI-generated, guided
**TEAL:** AI reference docs
**BLUE:** AI experiments (Claude creates only)

**Roadmap:** See `/ROADMAP.md`

## Configuration

**Bundle ID:** com.tidesmobile
**Supabase URL:** https://hcfxujzqlyaxvbetyano.supabase.co
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y`

## Tech Stack

**Required:** Use Context7 MCP documentation

**Core:** React Native 0.80.2 (NO EXPO), React 19.1.0, TypeScript 5.0.4
**Auth:** Supabase (email/password, Google, GitHub)
**Navigation:** React Navigation 7.x
**Storage:** AsyncStorage for JWT tokens
**Testing:** Jest, React Testing Library
**Protocol:** JSON-RPC 2.0 (NO SSE)
**Requirements:** Node.js >=18

## Architecture

**Features:**

- Layered contexts: Auth → MCP → Chat → Environment
- Singleton services
- Type-safe navigation
- Token-based design system
- JSON-RPC 2.0 MCP client
- Hybrid auth (mobile API keys, desktop UUIDs)

### Folder Structure

```text
src/
├── components/    # UI components
├── config/        # Configuration
├── context/       # State management (useReducer)
├── design-system/ # Design tokens + components
├── navigation/    # Type-safe routing
├── screens/       # Auth + Main screens
├── services/      # API layer (auth, MCP, logging)
├── types/         # TypeScript definitions
├── hooks/         # Custom hooks
└── utils/         # Utilities
```

### Services

- `authService.ts`: Supabase auth + API keys
- `mcpService.ts`: JSON-RPC 2.0 client
- `agentService.ts`: Agent communication
- `loggingService.ts`: Centralized logging

**Patterns:** Singleton, async/await, TypeScript, retry logic

### Contexts

- `AuthContext`: Auth state + API keys
- `MCPContext`: Server connection + tools
- `ChatContext`: Agent messaging
- `ServerEnvironmentContext`: Environment config

**Features:** useReducer, memoized values, type-safe actions

## Development Patterns

**Code:** Memoized components, singleton services, useReducer state
**Performance:** React.memo, useMemo/useCallback, context optimization
**Errors:** Error boundaries, try-catch blocks, retry logic

## Status

✅ MCP client with 8 tools
✅ Hybrid authentication
✅ Design system
✅ 95% TypeScript coverage
✅ Production ready

**Focus:** Feature expansion
