# Tides Mobile App Development Guide

## Project Overview

**Tides** is a mobile MCP client that tracks energy-based workflows and provides actionable feedback. The app communicates with MCP servers via HTTP/JSON-RPC 2.0 for tide management functionality.

**Architecture:** React Native Mobile App → HTTP/JSON-RPC 2.0 → MCP Server → Supabase/Cloudflare Storage

## Essential Development Process

### Before Starting Any Task

**ALWAYS use Context7 MCP for technology documentation:**

1. Query Context7 for relevant library documentation before implementation
2. Use these Context7 library IDs:

   - React Native: `/facebook/react-native-website`
   - Supabase: `/supabase/supabase`
   - TypeScript: `/microsoft/typescript`
   - React Navigation: `/react-navigation/react-navigation.github.io`
   - Cloudflare Workers: `/cloudflare/workers-sdk`

3. Check existing codebase structure in relevant folders - but feel free to modify/delete data
4. Follow established patterns for similar components/services
5. Test authentication flows thoroughly
6. Verify MCP server communication

## Technology Stack

### Core Technologies

- **React Native 0.80.2** (NO EXPO - pure React Native implementation)
- **React 19.1.0**
- **TypeScript 5.0.4**
- **Metro bundler**

### Backend & Authentication

- **Supabase** (auth providers: email/password, Google, GitHub)
- **@supabase/supabase-js ^2.52.1**
- **Authentication Method:** Hybrid system supporting:
  - **Mobile clients:** Custom API keys (`tides_{userId}_{randomId}`) with enhanced security
  - **Desktop clients:** UUID-based authentication (Claude Desktop, Goose Desktop)
  - **Cross-client compatibility:** Both methods map to same user data isolation

### Database Development Status

- **Current Status:** Development phase - database structure is flexible
- **Modification Policy:** Feel free to modify tables, data structures, schemas, or data as needed for app development
- **Schema Evolution:** Database structure should adapt to development needs - prioritize functionality over data preservation during development

### Navigation & Storage

- **@react-navigation/native ^7.1.14**
- **@react-navigation/native-stack ^7.3.21**
- **@react-native-async-storage/async-storage ^2.2.0**

### Development Tools

- **ESLint 8.19.0**
- **Jest 29.6.3**
- **React Testing Library**

## Configuration

### App Identifiers

- **App Name:** Tides
- **iOS Bundle ID:** com.tidesmobile
- **Android Package:** com.tidesmobile

### Supabase Configuration

- **Project URL:** `https://hcfxujzqlyaxvbetyano.supabase.co`
- **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjZnh1anpxbHlheHZiZXR5YW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwNDMyMjUsImV4cCI6MjA2ODYxOTIyNX0.5e4B-tb0orqvZdod2RanoP6O_j8j7Y8ZpjpUq30qA5Y`
- **Project Reference:** hcfxujzqlyaxvbetyano

## Project Architecture

### Recent Refactoring (August 2025)

**Status:** 88% complete (30/34 files), 60% test coverage, 95% type coverage

The codebase has undergone comprehensive refactoring with these major improvements:

#### Service Layer Architecture
- **BaseService.ts:** Abstract base class for all services
- **LoggingService.ts:** Centralized logging with structured levels
- **NotificationService.ts:** Event-driven user feedback system (replaces Alert)
- **Singleton pattern:** All services use getInstance() for consistency

#### State Management Optimization  
- **useReducer pattern:** Complex state uses typed reducers instead of useState
- **Memoized contexts:** Prevent unnecessary re-renders across component tree
- **Type-safe actions:** All state mutations through action creators

#### Performance Enhancements
- **React.memo:** All design system components memoized
- **useMemo/useCallback:** Strategic memoization for expensive operations
- **Event cleanup:** Proper listener cleanup in services

#### Testing Infrastructure
- **40 passing tests** across services and hooks
- **Jest setup:** React Native compatible test configuration
- **React Testing Library:** Component and hook testing patterns

### Folder Structure

```
src/
├── components/         # Reusable UI components (memoized)
├── config/            # Supabase, environment configs
├── context/           # React contexts (useReducer patterns)
├── design-system/     # Design tokens, memoized components
├── navigation/        # Navigation configuration
├── screens/           # Screen components
├── services/          # Service layer (BaseService inheritance)
│   ├── BaseService.ts      # Abstract base class
│   ├── LoggingService.ts   # Structured logging
│   ├── NotificationService.ts # User feedback
│   ├── AuthService.ts      # Enhanced authentication
│   └── MCPService.ts       # MCP protocol client
├── types/             # TypeScript definitions
├── utils/             # Utility functions
└── __tests__/         # Test infrastructure
    ├── setup.js            # Jest configuration
    ├── services/           # Service tests
    └── hooks/              # Hook tests
```

### Key Development Patterns

#### Service Usage
```typescript
// Singleton pattern
const logger = LoggingService.getInstance();
const notifier = NotificationService.getInstance();

// Replace Alert with NotificationService
NotificationService.error("Operation failed", "Error");
NotificationService.success("Data saved", "Success");

// Structured logging
LoggingService.info("User action", { userId, action: "sign_in" });
```

#### State Management
```typescript
// useReducer for complex state
const [state, dispatch] = useReducer(authReducer, initialState);

// Type-safe actions
dispatch({ type: 'SIGN_IN_START' });
dispatch({ type: 'SIGN_IN_SUCCESS', payload: user });
```

#### Performance Patterns
```typescript
// Memoized components
export const Button = React.memo(({ children, onPress, ...props }) => {
  const handlePress = useCallback(() => {
    onPress?.();
  }, [onPress]);
  
  return <TouchableOpacity onPress={handlePress} {...props}>{children}</TouchableOpacity>;
});
```

### React Contexts

- **AuthContext:** User authentication state (useReducer pattern)
- **MCPContext:** MCP server connection state (useReducer pattern)

## MCP Server Integration

### Current Server Architecture

**Primary Server (Cloudflare Workers):**

- **Path:** `/supabase-tides-demo-1`
- **Status:** Active development - proof of concept focus
- **URL:** `https://supabase-tides-demo-1.mason-c32.workers.dev`
- **Integration:** Cloudflare Worker with D1, KV, and authentication bindings
- **Authentication:** Hybrid authentication system implemented:
  - Custom API keys for mobile clients (short-lived, rotating)
  - UUID tokens for desktop clients (long-lived, revocable)
  - Cross-client data isolation maintained

**Priority:** Focus on JSONB data handling and scalable storage solutions rather than "enterprise production ready" complexity.

**Reference Server:**

- **Path:** `/tides-server`
- **Status:** Reference implementation with full tide tools
- **Contains:** Detailed tide tools implementation

### Available MCP Tools

1. `tide_create` - Create new tide workflows
2. `tide_list` - List existing tides
3. `tide_flow` - Manage tide flow states
4. `tide_add_energy` - Add energy measurements
5. `tide_link_task` - Link tasks to tides
6. `tide_list_task_links` - List task linkages
7. `tide_get_report` - Generate tide reports
8. `tides_get_participants` - Get tide participants

### Protocol Details

- **Communication:** MCP over HTTP (JSON-RPC 2.0)
- **Authentication:** Hybrid Bearer token system:
  - Mobile: `Bearer tides_{userId}_{randomId}` (custom keys)
  - Desktop: `Bearer {uuid}` (UUID tokens)
  - Server validates both formats automatically
- **NO Server-Sent Events (SSE)**

## Development Guidelines

### Code Organization Standards

- Place TypeScript interfaces inside components that use them
- Add console logging with unique numbers for each flow
- Use design system components from `src/design-system/`
- Follow navigation patterns in `src/navigation/`
- Implement services in `src/services/` with proper error handling

### Development Workflow

1. **Use Context7 MCP** before implementing any technology-specific features
2. **Query Context7** for React Native, Supabase, TypeScript, and React Navigation documentation
3. **No Expo dependencies** - pure React Native implementation only
4. **Implement retry logic** for all network requests
5. **Use async storage** for JWT token persistence across app restarts

### Testing Requirements

- Test authentication flows thoroughly
- Verify MCP server communication
- Implement proper error handling for network requests
- Use established service patterns for new API integrations
- Follow React Native performance best practices

## Current Development Status

### Completed (Phase 1)

- ✅ Authentication system established
- ✅ Navigation framework implemented
- ✅ Foundation architecture complete
- ✅ Supabase integration working
- ✅ Authentication header puzzle solved

### Active Development Focus

- **Primary:** Full integration of 8 tides tools from reference server
- **Authentication:** Hybrid system deployment (mobile + desktop client support)
- **Desktop Setup:** UUID export, QR code generation, desktop client configuration
- **Storage:** JSONB data handling optimization
- **Architecture:** Maintain scalable, proof-of-concept approach

### Next Phase Objectives

- Complete MCP integration with tide workflow management
- Optimize JSONB storage patterns
- Implement all 8 tide tools in primary server

## Critical Implementation Requirements

### Always Required

1. **Query Context7 MCP** for technology documentation before implementation
2. **Test hybrid authentication flows** thoroughly (both mobile and desktop)
3. **Implement proper error handling** for network requests
4. **Use established service patterns** for new API integrations
5. **Follow React Native best practices** (no Expo dependencies)
6. **Maintain authentication state** across app restarts using async storage
7. **Support cross-client compatibility** - ensure desktop clients can access same user data

### Storage Strategy

- **Priority:** JSONB data handling over R2 storage complexity
- **Focus:** Scalable, simple solutions rather than enterprise complexity
- **Goal:** Efficient data flow for tide workflow management

### Development Commands

```bash
# Start development
npm start
# or
yarn start

# For MCP server development (Cloudflare Workers)
wrangler dev --local

# Deploy MCP server
wrangler deploy
```

## Resources & References

- **Roadmap:** Follow `/ROADMAP.md` for phase progression
- **Context7 Access:** Available for all technology documentation needs
- **Codebase:** Full filetree and codebase access available
- **Authentication:** Working Supabase JWT integration with Cloudflare Workers
