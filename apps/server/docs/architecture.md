# Tides Architecture

## System Overview

Tides is a **universal agentic productivity platform** built on Cloudflare's edge infrastructure, combining Model Context Protocol (MCP) server capabilities with autonomous agents powered by Durable Objects. The platform enables any AI agent or client to intelligently interact with tidal workflow data through standardized protocols, making it the foundation for unlimited AI productivity applications.

```
┌──────────────────────────────────────────────────────────────┐
│                      Universal AI Client Layer               │
├────────────────┬─────────────────┬───────────────────────────┤
│ Claude Desktop │  React Native    │  Any AI Agent/Client     │
│   (MCP Client) │      App         │  (ChatGPT, Custom AI)    │
└────────┬───────┴────────┬────────┴───────────┬──────────────┘
         │ MCP Protocol    │ WebSocket         │ MCP/HTTPS
         ▼                 ▼                    ▼
┌──────────────────────────────────────────────────────────────┐
│                    Cloudflare Workers Edge                    │
├────────────────────────────────────────────────────────────  │
│                         index.ts                              │
│                    (Request Router)                           │
└────────┬──────────────┬──────────────┬──────────────────────┘
         │              │              │
         ▼              ▼              ▼
┌────────────────┬──────────────┬────────────────┐
│   MCP Server   │    Agents    │   Storage      │
├────────────────┼──────────────┼────────────────┤
│  server.ts     │  HelloAgent  │  D1 Database   │
│  - 9 Tools     │ TideProduct- │  R2 Storage    │
│  - Resources   │ ivityAgent   │  KV Namespace  │
│  - 5 Prompts   │ Analytics*   │  Durable Obj   │
└────────────────┴──────────────┴────────────────┘
                        │
                        ▼
              ┌─────────────────┐
              │   Workers AI    │
              │  (Intelligence) │
              └─────────────────┘

* Planned agents
```

## Core Components

### 1. Request Router (`src/index.ts`)

The main Worker entry point that handles all incoming requests:

- **Path `/mcp`**: Routes to MCP server for tool execution
- **Path `/agents/*`**: Routes to appropriate Durable Object agent
- **Path `/health`**: System health checks
- **Authentication**: Validates API keys before processing

### 2. MCP Server (`src/server.ts`)

Implements the Model Context Protocol specification:

#### Tools
Executable functions that AI models can invoke:
- `tide_create` - Create new workflow tides
- `tide_flow` - Start/stop flow sessions
- `tide_add_energy` - Track energy levels
- `tide_link_task` - Connect external tasks
- `tide_get_report` - Generate analytics

#### Resources
Data exposed to AI models:
- User configurations
- Tide templates
- Analytics data

#### Prompts (5 Analysis Prompts)
Specialized analysis prompts for productivity insights:
- `analyze_tide` - Comprehensive tide performance analysis
- `productivity_insights` - Pattern recognition and optimization
- `optimize_energy` - Energy-based scheduling recommendations  
- `team_insights` - Multi-user collaboration analysis
- `custom_tide_analysis` - Flexible user-defined analysis

### 3. Durable Object Agents

Autonomous agents that maintain persistent state and handle real-time features:

#### HelloAgent (Implemented)
- Demonstrates agent pattern
- WebSocket support
- State persistence
- Visit tracking

#### TideProductivityAgent (Implemented)
- AI-powered productivity analysis using MCP prompts
- Intelligent scheduling recommendations
- Energy pattern analysis and optimization
- Comprehensive workflow insights and reporting

#### AnalyticsAgent (Planned)
- Aggregate productivity metrics
- Pattern recognition
- Trend analysis
- Predictive insights

### 4. Storage Layer

#### D1 Database
Primary relational storage for structured data:
```sql
- users (id, email, api_key, created_at)
- tides (id, user_id, name, flow_type, metadata)
- flow_sessions (id, tide_id, start_time, duration)
- tide_tasks (id, tide_id, external_id, platform)
- energy_readings (id, user_id, level, timestamp)
```

#### R2 Storage
Object storage for large data:
- Session recordings
- Export files
- Report attachments
- Backup data

#### Durable Object Storage
Agent-specific persistent state:
- WebSocket connections
- Session state
- Real-time metrics
- Agent memory

## Data Flow

### MCP Tool Execution Flow
```
1. Client sends MCP request with tool invocation
2. Worker validates authentication via API key
3. MCP server processes tool with parameters
4. Tool queries/updates D1 database
5. Response formatted and returned to client
```

### Agent WebSocket Flow
```
1. React Native app connects to agent WebSocket
2. Agent establishes persistent connection
3. Real-time updates broadcast to all clients
4. State persisted in Durable Object storage
5. Automatic reconnection on disconnect
```

### Multi-User Isolation
```
1. API key identifies unique user
2. User ID scopes all database queries
3. Agent instances isolated per user
4. No cross-user data access possible
```

## Security Architecture

### Authentication
- **API Key Based**: Bearer token authentication
- **User Isolation**: Each key maps to single user
- **Request Validation**: All endpoints require auth

### Data Protection
- **Encryption at Rest**: D1 and R2 encrypted
- **TLS in Transit**: All connections over HTTPS/WSS
- **Input Validation**: Zod schemas on all inputs
- **SQL Injection Prevention**: Parameterized queries

### Rate Limiting
- **Per-User Limits**: Prevent abuse
- **Agent Throttling**: WebSocket message limits
- **Global Protection**: Cloudflare DDoS protection

## Deployment Architecture

### Environment Separation
```
Development (tides-001):
- Rapid iteration
- Test data
- Debug logging

Staging (tides-002):
- Pre-production validation
- Integration testing
- Performance testing

Production (tides-003):
- Live user traffic
- High availability
- Monitoring enabled
```

### CI/CD Pipeline
```
1. Code pushed to GitHub
2. Tests run automatically
3. Deploy to development
4. E2E tests validate
5. Promote to staging
6. Final validation
7. Deploy to production
```

## Performance Considerations

### Edge Computing Benefits
- **Global Distribution**: 200+ data centers
- **Low Latency**: <50ms worldwide
- **Auto-Scaling**: Handles traffic spikes
- **Zero Cold Starts**: Always warm

### Optimization Strategies
- **Database Indexes**: Composite indexes for queries
- **Caching**: KV for frequently accessed data
- **Batch Operations**: Reduce round trips
- **Connection Pooling**: Reuse database connections

## Monitoring & Observability

### Metrics Collection
- Request counts and latency
- Agent connection stats
- Database query performance
- Error rates and types

### Logging
- Structured JSON logs
- Request tracing
- Agent event streams
- Error stack traces

### Alerting
- Health check failures
- Error rate thresholds
- Performance degradation
- Agent crashes

## Future Architecture Plans

### Phase 1: Enhanced Agents
- TideAgent for flow management
- AnalyticsAgent for insights
- NotificationAgent for reminders

### Phase 2: AI Integration
- Workers AI for pattern recognition
- Predictive scheduling
- Natural language commands
- Sentiment analysis

### Phase 3: Collaboration
- Shared flow sessions
- Team analytics
- Synchronous productivity
- Group scheduling

## Technology Stack

### Runtime
- **Cloudflare Workers**: V8 isolate runtime
- **TypeScript**: Type-safe development
- **Node.js APIs**: Compatible subset

### Frameworks
- **MCP SDK**: Model Context Protocol
- **Zod**: Schema validation
- **Wrangler**: Deployment tooling

### Testing
- **Jest**: Test framework
- **Mock Service Worker**: API mocking
- **Node Test Runner**: E2E testing

## Development Guidelines

### Code Organization
- Domain-driven design
- Single responsibility principle
- Dependency injection
- Clean architecture

### Best Practices
- Async/await patterns
- Error boundaries
- Comprehensive logging
- Type safety

### Performance
- Minimize bundle size
- Optimize database queries
- Cache when possible
- Profile regularly

## Scaling Considerations

### Horizontal Scaling
- Workers auto-scale globally
- Durable Objects partition by ID
- Database read replicas
- CDN for static assets

### Vertical Scaling
- Increase Worker CPU limits
- Expand database size
- Upgrade R2 storage
- Add more agent types

### Cost Optimization
- Free tier utilization
- Request batching
- Efficient storage use
- Smart caching

## Conclusion

Tides architecture leverages Cloudflare's edge infrastructure to provide a globally distributed, highly available productivity platform. The combination of MCP server capabilities with autonomous agents enables both AI-driven automation and real-time user experiences.