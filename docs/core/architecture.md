# Tides Architecture Overview

## System Architecture

Tides is a multi-platform MCP ecosystem with:

- **Server** (`apps/server/`): Cloudflare Workers MCP server
- **Mobile** (`apps/mobile/`): React Native workflow tracker  
- **Web** (`apps/web/`): Next.js frontend
- **Architecture**: Mobile → HTTP/JSON-RPC 2.0 → MCP Server → Cloudflare D1/R2

## High-Level Communication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web App       │    │ Desktop Clients │
│  (React Native) │    │  (Next.js)      │    │ (Claude/MCP)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ JSON-RPC 2.0          │ HTTP/JSON             │ MCP Protocol
         └─────────┬─────────────┼───────────────────────┤
                   │             │                       │
                   ▼             ▼                       ▼
          ┌─────────────────────────────────────────────────┐
          │            MCP Server (Cloudflare)             │
          │     ┌─────────────────────────────────────┐     │
          │     │    MCP Tools & Agent Services       │     │
          │     │  • tide_create, tide_list           │     │
          │     │  • tide_flow, tide_add_energy       │     │
          │     │  • AI productivity analysis         │     │
          │     │  • Conversational agent             │     │
          │     └─────────────────────────────────────┘     │
          └─────────────────────────────────────────────────┘
                                   │
                                   ▼
          ┌─────────────────────────────────────────────────┐
          │              Data Layer                         │
          │  ┌─────────────┐    ┌─────────────────────────┐ │
          │  │ Cloudflare  │    │   Supabase Database     │ │
          │  │ D1 + R2     │    │    (User Auth Only)     │ │
          │  │ (Primary    │    │                         │ │
          │  │  Storage)   │    └─────────────────────────┘ │
          │  └─────────────┘                               │
          └─────────────────────────────────────────────────┘
```

## Technology Stack

**Server**: Cloudflare Workers, ModelFetch, MCP SDK, Zod, Jest
**Mobile**: React Native 0.80.2 (NO EXPO), TypeScript, Supabase, React Navigation  
**Web**: Next.js 15.4.3, React 19.1.0, TypeScript
**Testing**: Jest (server), Vitest (demo app)

## Data Storage Strategy

**Primary**: Cloudflare D1 (SQL) + R2 (Object Storage)
- D1: User auth, API keys, tide metadata
- R2: Full tide JSON data at `users/{userId}/tides/{tideId}.json`

**Supabase**: ONLY for user authentication & initial API key generation
**NOT in Supabase**: Tide data, flow sessions, energy levels, task links

## Authentication Architecture

**Hybrid System**:
- Mobile: `tides_{userId}_{randomId}` API keys  
- Desktop: UUID tokens
- Cross-client compatibility with same user_id mapping

## MCP Protocol Implementation

**Tools**: 8 core tide management functions
**Prompts**: 13 analysis templates
**Resources**: Application configuration access
**Communication**: JSON-RPC 2.0 over HTTP with Bearer token auth

## Mobile App Architecture

**Patterns**:
- Layered contexts: Auth → MCP → Chat → Environment
- useReducer for state management
- Singleton services with getInstance()
- React.memo optimization
- Type-safe navigation
- Token-based design system

## Performance Characteristics

- **AI Tools**: ~500ms for quick analysis, ~2s for detailed
- **Regular Tools**: <100ms response time  
- **WebSocket**: Real-time with <50ms latency
- **Caching**: 15-30 minute TTL for AI responses

## Key Design Decisions

See `/decisions/` folder for detailed Architecture Decision Records:

1. **MCP Session Storage Strategy** - Hybrid local/remote caching
2. **Tide Data Storage Format** - JSONB over R2 complexity  
3. **Hierarchical Tide Context System** - Multi-level tide organization

## Security Model

- **Transport**: All HTTPS with Bearer tokens
- **Mobile Storage**: Device keychain for API keys
- **User Isolation**: Data segregated by authenticated user_id
- **Token Rotation**: Manual refresh capability

## Deployment Environments

- env.001 → `tides-001.mpazbot.workers.dev` (dev)
- env.002 → `tides-002.mpazbot.workers.dev` (staging)  
- env.003 → `tides-003.mpazbot.workers.dev` (prod)
- env.006 → `tides-006.mpazbot.workers.dev` (mason dev)

For detailed implementation specifics, see the respective documentation in each section.