# Tides - Rythmic Workflows

## Overview

The Tides project is a sophisticated monorepo ecosystem implementing a **Model Context Protocol (MCP)** server architecture with **Cloudflare Durable Object agents** and a **React Native mobile client**. The architecture demonstrates a modern serverless pattern where mobile applications communicate with MCP servers through specialized productivity agents.

## High-Level Architecture

```mermaid
graph TB
    Mobile[Mobile App<br/>React Native]
    Server[MCP Server<br/>Cloudflare Workers]
    Agents[Productivity Agents<br/>Durable Objects]
    Storage[(Storage Layer<br/>D1 + R2 + Supabase)]

    Mobile -->|JSON-RPC 2.0<br/>HTTP + Bearer Auth| Server
    Mobile -->|WebSocket<br/>Real-time| Agents
    Server -->|MCP Protocol| Agents
    Server -->|Tool Execution| Storage
    Agents -->|Data Access| Storage

    style Mobile fill:#e1f5fe
    style Server fill:#f3e5f5
    style Agents fill:#fff3e0
    style Storage fill:#e8f5e8
```

## Core App Relationships

### 1. **Mobile App (`apps/mobile/`)** - Client Layer

**Architecture**: React Native 0.80.2 (NO EXPO) with modular design

**Key Components**:

- **MCP Client**: JSON-RPC 2.0 communication with server
- **Authentication**: Hybrid Supabase + API key system
- **State Management**: useReducer patterns with React Context
- **Design System**: Token-based UI components

**Communication Pattern**:

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant A as Auth Service
    participant S as MCP Server
    participant AG as Productivity Agent

    M->>A: Authenticate (Supabase)
    A->>M: API Key (tides_{userId}_{randomId})
    M->>S: MCP Tool Call (Bearer token)
    S->>AG: Delegate to Agent
    AG->>S: Response
    S->>M: JSON-RPC Response
```

### 2. **Server App (`apps/server/`)** - Protocol Layer

**Architecture**: Cloudflare Workers MCP Server with ModelFetch integration

**Key Components**:

- **MCP Server**: Core protocol implementation (`server.ts`)
- **HTTP Handler**: Request routing and CORS (`index.ts`)
- **Tool System**: 8 tide management tools organized by domain
- **Authentication**: Multi-tenant API key validation
- **Storage**: D1/R2 hybrid with JSONB optimization

**Tool Organization**:

```mermaid
graph LR
    subgraph "MCP Tools (8 total)"
        Core[Core Management<br/>tide_create<br/>tide_list]
        Sessions[Flow Sessions<br/>tide_flow<br/>tide_add_energy]
        Tasks[Task Integration<br/>tide_link_task<br/>tide_list_task_links]
        Analytics[Analytics<br/>tide_get_report<br/>tides_get_participants]
    end

    Server[MCP Server] --> Core
    Server --> Sessions
    Server --> Tasks
    Server --> Analytics
```

### 3. **Agents App (`apps/agents/`)** - Intelligence Layer

**Architecture**: Cloudflare Durable Objects providing autonomous AI functionality

**Current Agents**:

#### **TideProductivityAgent**

- **Purpose**: AI-powered productivity analysis and recommendations
- **Technology**: Durable Objects + Cloudflare Workers AI
- **Features**: Energy pattern analysis, workflow optimization, team insights
- **Communication**: REST API + WebSocket for real-time updates

#### **HelloAgent** (Reference Implementation)

- **Purpose**: Demonstrates agent pattern and testing infrastructure
- **Features**: Simple greeting, visit counting, message storage
- **Communication**: REST + WebSocket

**Agent Architecture**:

```mermaid
graph TB
    subgraph "TideProductivityAgent"
        Agent[Agent Core]
        Services[Services Layer<br/>MCP Client<br/>AI Analyzer<br/>WebSocket Manager<br/>Preferences Store]
        Handlers[Request Handlers<br/>Insights<br/>Optimize<br/>Questions<br/>Preferences]
        Utils[Utilities<br/>Tide Fetcher<br/>Confidence Parser]
    end

    Agent --> Services
    Agent --> Handlers
    Services --> Utils
    Handlers --> Services
```

## Data Flow Architecture

### Primary Communication Patterns

#### 1. **Mobile → Server (MCP Tools)**

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant MCP as MCP Server
    participant Storage as D1/R2 Storage

    M->>MCP: JSON-RPC 2.0 Tool Call
    Note over M,MCP: Bearer: tides_{userId}_{randomId}
    MCP->>Storage: Validate API Key
    Storage->>MCP: Auth Context
    MCP->>Storage: Execute Tool (createTide, listTides, etc.)
    Storage->>MCP: Tool Result
    MCP->>M: Wrapped Response
    Note over MCP,M: {"result": {"content": [{"type": "text", "text": "{json_data}"}]}}
```

#### 2. **Mobile → Agents (Real-time Analysis)**

```mermaid
sequenceDiagram
    participant M as Mobile App
    participant Router as Server Router
    participant Agent as TideProductivityAgent

    M->>Router: POST /agents/tide-productivity/question
    Router->>Agent: Route with Auth Context
    Agent->>Agent: Fetch User Tides
    Agent->>Agent: Process Question
    Agent->>M: Conversational Response
```

#### 3. **Agent → Server (Data Access)**

```mermaid
sequenceDiagram
    participant Agent as Productivity Agent
    participant MCP as MCP Client (in Agent)
    participant Server as MCP Server
    participant Storage as Storage Layer

    Agent->>MCP: Internal Tool Call
    MCP->>Server: MCP Request (authenticated)
    Server->>Storage: Query Tide Data
    Storage->>Server: Raw JSON from R2
    Server->>MCP: Tool Response
    MCP->>Agent: Structured Data
```

## Storage Architecture

### Multi-Layer Storage Strategy

```mermaid
graph TB
    subgraph "Storage Layers"
        Supabase[(Supabase<br/>Authentication Only)]
        D1[(Cloudflare D1<br/>Metadata + API Keys)]
        R2[(Cloudflare R2<br/>Full Tide JSON)]
    end

    subgraph "Data Patterns"
        Auth[User Authentication<br/>OAuth Providers]
        Meta[Tide Metadata<br/>user_id, created_at, status]
        Full[Complete Tide Data<br/>JSONB at users/{userId}/tides/{tideId}.json]
    end

    Supabase --> Auth
    D1 --> Meta
    R2 --> Full
```

**Data Flow**:

1. **Supabase**: User authentication and initial API key generation
2. **D1**: Fast metadata queries and API key validation
3. **R2**: Complete tide data storage as JSONB files

## Authentication Architecture

### Hybrid Authentication System

```mermaid
graph LR
    subgraph "Mobile Authentication"
        User[User] --> Supabase[Supabase OAuth]
        Supabase --> APIGen[API Key Generation]
        APIGen --> Mobile[Mobile Storage<br/>tides_{userId}_{randomId}]
    end

    subgraph "Desktop Authentication"
        Desktop[Desktop Client] --> UUID[UUID Tokens<br/>{uuid}]
    end

    subgraph "Server Validation"
        Mobile --> Server[MCP Server]
        Desktop --> Server
        Server --> D1[D1 Validation]
        Server --> Fallback[Test Key Fallback<br/>testuser_001-005]
    end
```

## Technology Stack Relationships

### Core Technologies per App

| App        | Runtime             | Framework            | Protocol         | Storage      | Auth          |
| ---------- | ------------------- | -------------------- | ---------------- | ------------ | ------------- |
| **Mobile** | React Native 0.80.2 | React 19.1.0         | JSON-RPC 2.0     | AsyncStorage | Supabase      |
| **Server** | Cloudflare Workers  | ModelFetch + MCP SDK | MCP over HTTP    | D1 + R2      | Bearer Tokens |
| **Agents** | Durable Objects     | Custom Classes       | REST + WebSocket | DO Storage   | Inherited     |

### Cross-App Dependencies

```mermaid
graph TB
    subgraph "Shared Dependencies"
        TypeScript[TypeScript 5.0.4+<br/>Type Safety]
        MCP[MCP Protocol<br/>JSON-RPC 2.0]
        Auth[Hybrid Authentication<br/>API Keys + OAuth]
    end

    subgraph "Mobile Specific"
        RN[React Native 0.80.2]
        Supabase[Supabase Client]
        AsyncStorage[AsyncStorage]
    end

    subgraph "Server Specific"
        Workers[Cloudflare Workers]
        ModelFetch[ModelFetch SDK]
        D1R2[D1 + R2 Storage]
    end

    subgraph "Agents Specific"
        DO[Durable Objects]
        WorkersAI[Cloudflare Workers AI]
        WebSockets[WebSocket Support]
    end

    TypeScript --> RN
    TypeScript --> Workers
    TypeScript --> DO
    MCP --> RN
    MCP --> Workers
    Auth --> RN
    Auth --> Workers
    Auth --> DO
```

## Development Patterns

### Architectural Principles

1. **Modular Design**: Each app follows single-responsibility principles
2. **Type Safety**: End-to-end TypeScript coverage (95%+)
3. **Service-Oriented**: Clean separation between services, contexts, and UI
4. **Performance Optimized**: React.memo, useCallback, and efficient state management
5. **Scalable Storage**: JSONB over enterprise complexity

### Code Organization Patterns

#### Mobile App (86% Code Reduction Achieved)

```
src/
├── components/     # Modular UI components (extracted from Home.tsx)
├── hooks/          # Custom state management hooks
├── context/        # useReducer-based state management
├── services/       # Singleton service pattern
├── design-system/  # Token-based design system
└── screens/        # Clean orchestration layers
```

#### Server App (Domain-Driven Design)

```
src/
├── handlers/       # Request handling by domain
├── tools/          # MCP tools organized by function
├── storage/        # Storage abstraction layer
├── prompts/        # AI prompt templates
└── services/       # Business logic services
```

#### Agents App (Service-Oriented Architecture)

```
agents/
├── tide-productivity-agent/
│   ├── services/   # Core business services
│   ├── handlers/   # Request/response handling
│   ├── types/      # Domain types
│   └── utils/      # Utility functions
└── hello/          # Reference implementation
```

## Performance & Scalability Considerations

### Optimization Strategies

1. **Mobile Performance**:
   - React.memo for component optimization
   - useCallback for function memoization
   - Modular architecture reduces bundle size
   - AsyncStorage for offline capability

2. **Server Scalability**:
   - Cloudflare Workers edge computing
   - D1 for fast metadata queries
   - R2 for scalable JSON storage
   - ModelFetch for efficient MCP handling

3. **Agent Efficiency**:
   - Durable Objects for persistent state
   - WebSocket for real-time communication
   - Cloudflare AI for on-edge analysis
   - Service-oriented design for modularity

### Resource Management

```mermaid
graph LR
    subgraph "Resource Allocation"
        Mobile[Mobile App<br/>Local State<br/>AsyncStorage]
        Edge[Edge Workers<br/>MCP Processing<br/>Global Distribution]
        Objects[Durable Objects<br/>Per-User Agents<br/>Persistent State]
        Storage[Distributed Storage<br/>D1 Global<br/>R2 Regional]
    end

    Mobile -->|HTTP/2| Edge
    Edge -->|RPC| Objects
    Edge -->|SQL| Storage
    Objects -->|Direct| Storage
```

## Future Architecture Evolution

### Planned Enhancements

1. **Agent Ecosystem Expansion**:
   - TideAgent: Direct flow session management
   - AnalyticsAgent: Pattern aggregation
   - NotificationAgent: Smart reminders
   - CollaborationAgent: Multi-user sessions

2. **Protocol Enhancement**:
   - WebSocket MCP support for real-time updates
   - Agent-to-agent communication patterns
   - Enhanced prompt system for AI interactions

3. **Performance Optimization**:
   - Edge-optimized mobile builds
   - Advanced caching strategies
   - Predictive data loading
