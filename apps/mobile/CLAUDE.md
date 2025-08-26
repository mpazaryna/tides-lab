# Tides Mobile Development

**React Native MCP client for tide workflow management**

**Architecture:** React Native → JSON-RPC 2.0 → MCP Server → Supabase

## Development Process

**Required:** Query Context7 MCP first for all implementations

**Context7 Library IDs:**

- React Native: `/facebook/react-native-website`
- Supabase: `/supabase/supabase`
- TypeScript: `/microsoft/typescript`
- React Navigation: `/react-navigation/react-navigation.github.io`
- Cloudflare Workers: `/cloudflare/workers-sdk`

## Tech Stack

**Core:** React Native 0.80.2 (NO EXPO), React 19.1.0, TypeScript 5.0.4

**Auth:** Supabase with hybrid authentication:

- Mobile: `tides_{userId}_{randomId}` API keys
- Desktop: UUID tokens

**Navigation:** React Navigation 7.x
**Storage:** AsyncStorage
**Testing:** Jest, React Testing Library

## Configuration

**Bundle ID:** com.tidesmobile
**Supabase URL:** `https://hcfxujzqlyaxvbetyano.supabase.co`
**Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y`

## Architecture

**Status:** 95% TypeScript coverage, full MCP integration

**Patterns:**

- Layered contexts: Auth → MCP → Chat → Environment
- useReducer for state management
- Singleton services with getInstance()
- React.memo optimization
- Type-safe navigation
- Token-based design system

## Recent Architecture Improvements

**🎯 Major Refactoring Completed (Aug 2025)**
- **86% code reduction** in Home.tsx (1,866 → 269 lines)
- **14 new focused modules** extracted
- **Zero breaking changes** - all functionality preserved
- **Modular architecture** with clean separation of concerns

### Comprehensive Folder Architecture

```
src/
├── components/         # Modular UI components with memoization
│   ├── chat/           # Chat-related components (NEW)
│   │   ├── ChatInput.tsx           # Message input interface
│   │   ├── ChatMessages.tsx        # Messages container with empty state
│   │   └── MessageBubble.tsx       # Individual message display
│   ├── tides/          # Tides display components (NEW)
│   │   ├── TidesSection.tsx        # Active tides section with loading states
│   │   └── TideCard.tsx            # Individual tide card with icons
│   ├── tools/          # Tool-related components (NEW)
│   │   ├── ToolMenu.tsx            # Tool selection menu with animations
│   │   └── ToolCallDisplay.tsx     # Tool execution display
│   ├── debug/          # Debug components (NEW)
│   │   └── DebugPanel.tsx          # Debug test interface
│   ├── [design-system components]  # Existing design system
│   │   ├── Button.tsx              # 5 variants × 3 sizes with loading states
│   │   ├── Card.tsx                # 3 variants with shadow system
│   │   ├── Text.tsx                # Variant-based with font loading
│   │   ├── Input.tsx               # Form inputs with validation
│   │   ├── Container.tsx           # Layout containers
│   │   ├── Stack.tsx               # Spacing and layout utilities
│   │   ├── SafeArea.tsx            # Safe area management
│   │   ├── Loading.tsx             # Loading states and indicators
│   │   ├── Notification.tsx        # User feedback system
│   │   └── ErrorBoundary.tsx       # Error boundary with logging
│   ├── Auth.tsx                    # Authentication form with validation
│   ├── FlowSession.tsx             # Complex flow session management
│   └── ServerEnvironmentSelector.tsx # Multi-environment switching
├── hooks/             # Custom state management hooks (ENHANCED)
│   ├── useTidesManagement.ts       # Tides state & operations (NEW)
│   ├── useToolMenu.ts              # Tool menu state & animations (NEW)
│   ├── useDebugPanel.ts            # Debug functionality (NEW)
│   ├── useChatInput.ts             # Chat input logic (NEW)
│   ├── useAsyncAction.ts           # Base async operation pattern
│   ├── useAuthActions.ts           # Authentication action helpers
│   ├── useAuthStatus.ts            # Authentication state utilities
│   ├── useMCPConnection.ts         # MCP connection management
│   └── index.ts                    # Hook exports
├── utils/             # Utility functions (ENHANCED)
│   ├── agentCommandUtils.ts        # Agent context & execution (NEW)
│   ├── debugUtils.ts               # Debug test functions (NEW)
│   └── fonts.ts                    # Font loading utilities
├── config/            # Environment and service configuration
│   └── supabase.ts                 # Supabase client configuration
├── context/           # Advanced state management with useReducer
│   ├── AuthContext.tsx             # Authentication state with API key management
│   ├── MCPContext.tsx              # MCP connection and tool execution
│   ├── ChatContext.tsx             # Agent communication management
│   ├── ServerEnvironmentContext.tsx # Multi-environment configuration
│   ├── authTypes.ts                # Auth reducer patterns and types
│   ├── mcpTypes.ts                 # MCP reducer patterns and types
│   └── ServerEnvironmentTypes.ts   # Environment configuration types
├── design-system/     # Comprehensive design token system
│   ├── tokens.ts                   # Colors, typography, spacing, shadows
│   └── index.ts                    # Design system exports
├── navigation/        # Type-safe navigation architecture
│   ├── RootNavigator.tsx           # Auth-gated navigation root
│   ├── AuthNavigator.tsx           # Authentication flow navigation
│   ├── MainNavigator.tsx           # Main app navigation with headers
│   ├── types.ts                    # Navigation type definitions
│   ├── hooks.ts                    # Type-safe navigation utilities
│   └── index.ts                    # Navigation exports
├── screens/           # Clean, focused screen components (REFACTORED)
│   ├── Auth/                       # Authentication screens
│   │   ├── Initial.tsx             # Sign-in with OAuth providers
│   │   └── CreateAccount.tsx       # Registration with validation
│   └── Main/                       # Main application screens
│       ├── Home.tsx                # Clean orchestration layer (269 lines, was 1,866)
│       └── Settings.tsx            # Configuration and debug interface
├── services/          # Enterprise-grade service layer
│   ├── authService.ts              # Supabase auth + API key management
│   ├── mcpService.ts               # JSON-RPC 2.0 MCP client implementation
│   ├── agentService.ts             # Agent communication service
│   ├── loggingService.ts           # Centralized logging service
│   ├── secureStorage.ts            # Secure storage utilities
│   └── index.ts                    # Service exports
├── types/             # Comprehensive type system
│   ├── index.ts                    # Central type export point
│   ├── chat.ts                     # Chat interface and agent communication
│   ├── mcp.ts                      # MCP protocol and JSON-RPC 2.0 types
│   ├── models.ts                   # Domain model definitions
│   ├── api-types.ts                # API response contracts
│   ├── api.ts                      # API client types
│   ├── connection.ts               # Connection state types
│   └── agents.ts                   # Agent service types
└── constants/         # Application constants
    └── index.ts                    # Centralized constants
```

### Patterns

**Architecture:** Modular components with single responsibility
**State Management:** Custom hooks + useReducer for complex state
**Services:** Singleton with `getInstance()`
**Performance:** React.memo + useCallback, optimized re-rendering
**Components:** Extracted, focused, reusable modules
**Contexts:** Auth, MCP, Chat, Environment

## MCP Server Integration

**Primary:** `https://supabase-tides-demo-1.mason-c32.workers.dev`
**Protocol:** JSON-RPC 2.0 over HTTP
**Auth:** Bearer tokens (mobile: `tides_{userId}_{randomId}`, desktop: `{uuid}`)
**Tools:** 8 tide management functions
**Reference:** `/tides-server`

### MCP Tools

1. `tide_create` - Create workflows
2. `tide_list` - List tides
3. `tide_flow` - Manage flow states
4. `tide_add_energy` - Add energy data
5. `tide_link_task` - Link tasks
6. `tide_list_task_links` - List links
7. `tide_get_report` - Generate reports
8. `tides_get_participants` - Get participants

### Protocol

**Communication:** JSON-RPC 2.0 over HTTP
**Retry:** Exponential backoff
**Auth:** Hybrid Bearer tokens
**Health:** Auto health checks
**Recovery:** Auto reconnection

## Guidelines

**Code:**

- TypeScript interfaces in components
- Design system components only
- Services with error handling
- NO Expo dependencies

**Testing:**

- Auth flows
- MCP communication
- Network error handling

## Status

**Complete:**

- ✅ Auth system
- ✅ Navigation
- ✅ Supabase integration
- ✅ MCP client
- ✅ **Modular architecture** - 86% code reduction achieved
- ✅ **Component extraction** - 14 focused modules created
- ✅ **Custom hooks** - State management properly separated

**Active:**

- 8 tide tools integration
- Hybrid auth deployment
- JSONB optimization
- **Feature expansion** with maintainable codebase

## Requirements

1. Query Context7 MCP first
2. Test auth flows (mobile + desktop)
3. Network error handling
4. AsyncStorage for auth state
5. Cross-client compatibility

**Storage:** JSONB over R2 complexity

## Commands

```bash
npm start                 # Mobile dev
wrangler dev --local      # Server dev
wrangler deploy           # Deploy server
```
