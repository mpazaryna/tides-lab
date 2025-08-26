# Agent Architecture Refactor Specification

**Status**: 🔄 On Hold (Pending Learning Phase)  
**Priority**: Medium  
**Timeline**: After learning phase completion (~2 weeks)

## Overview

This specification outlines the proposed refactor of the current monolithic `TideProductivityAgent` into a distributed multi-agent system using Cloudflare Workers-native patterns.

## Current State

### Existing Architecture
```
TideProductivityAgent (Single Durable Object)
├── Insights generation
├── Schedule optimization  
├── Custom Q&A analysis
├── User preferences management
├── WebSocket real-time communication
└── MCP server integration
```

**Current Stats:**
- **1 agent** handling all productivity features
- **191 lines** main agent file
- **19 supporting modules** (2,189 total lines)
- **11 comprehensive tests** covering HTTP API
- **✅ Production ready** and well-architected

## Proposed Architecture

### Multi-Agent System Design

```
Agent Ecosystem
├── CoordinatorAgent (new)         # Routes tasks, orchestrates workflows
├── InsightsAgent (extracted)      # Productivity insights generation  
├── OptimizationAgent (extracted)  # Schedule optimization
├── AnalysisAgent (extracted)      # Custom Q&A processing
├── PreferencesAgent (extracted)   # User settings management
├── NotificationAgent (extracted)  # Real-time WebSocket communication
└── DataAgent (new)               # MCP/external data integration
```

### Agent Responsibilities

#### 1. CoordinatorAgent (New)
**Purpose**: Central orchestrator and task router  
**Responsibilities**:
- Route incoming requests to appropriate specialist agents
- Orchestrate multi-step workflows requiring multiple agents
- Manage agent discovery and health monitoring
- Handle complex user requests that span multiple domains

**API Endpoints**:
```typescript
POST /agents/coordinator/task        # Route complex tasks
GET  /agents/coordinator/status      # System health overview
POST /agents/coordinator/workflow    # Multi-step workflow execution
```

#### 2. InsightsAgent (Extracted from current)
**Purpose**: Generate productivity insights and recommendations  
**Responsibilities**:
- Analyze productivity patterns using AI
- Generate actionable insights
- Calculate confidence scores and priorities
- Historical insight tracking

**API Endpoints**:
```typescript
POST /agents/insights/{userId}/analyze    # Generate insights
GET  /agents/insights/{userId}/latest     # Get recent insights  
GET  /agents/insights/{userId}/history    # Insight history
```

#### 3. OptimizationAgent (Extracted from current)
**Purpose**: Schedule and energy optimization  
**Responsibilities**:
- Energy pattern analysis
- Schedule optimization recommendations
- Auto-implementation of high-confidence changes
- Preference-based optimization

**API Endpoints**:
```typescript
POST /agents/optimization/{userId}/schedule      # Optimize schedule
POST /agents/optimization/{userId}/energy        # Energy optimization
GET  /agents/optimization/{userId}/recommendations # Get suggestions
```

#### 4. AnalysisAgent (Extracted from current)
**Purpose**: Custom Q&A and analytical processing  
**Responsibilities**:
- Process custom user questions
- Intelligent tide selection for questions
- AI-powered analysis and responses
- Analysis result broadcasting

**API Endpoints**:
```typescript
POST /agents/analysis/{userId}/question       # Process questions
GET  /agents/analysis/{userId}/conversations  # Question history
POST /agents/analysis/{userId}/context        # Set analysis context
```

#### 5. PreferencesAgent (Extracted from current)
**Purpose**: User preferences and settings management  
**Responsibilities**:
- CRUD operations for user preferences
- Preference validation and defaults
- Preference change notifications
- Cross-agent preference synchronization

**API Endpoints**:
```typescript
GET  /agents/preferences/{userId}           # Get preferences
POST /agents/preferences/{userId}           # Update preferences  
GET  /agents/preferences/{userId}/defaults  # Get default settings
```

#### 6. NotificationAgent (Extracted from current)
**Purpose**: Real-time communication and notifications  
**Responsibilities**:
- WebSocket connection management
- Real-time notification delivery
- User session tracking
- Cross-agent event broadcasting

**API Endpoints**:
```typescript
WebSocket /agents/notifications/{userId}/ws     # WebSocket connection
POST      /agents/notifications/{userId}/send   # Send notification
GET       /agents/notifications/{userId}/status # Connection status
```

#### 7. DataAgent (New)
**Purpose**: External data integration and MCP communication  
**Responsibilities**:
- All MCP server communication
- Tide data fetching and caching
- External API integrations
- Data transformation and validation

**API Endpoints**:
```typescript
GET  /agents/data/{userId}/tides           # Get user tides
POST /agents/data/mcp/prompt              # Execute MCP prompt
GET  /agents/data/{userId}/tide/{tideId}   # Get specific tide
POST /agents/data/{userId}/cache/refresh   # Refresh cached data
```

## Technical Implementation

### Inter-Agent Communication

#### 1. HTTP-Based Communication
```typescript
// Agent-to-agent HTTP calls
const response = await fetch(`/agents/data/${userId}/tides`, {
  method: 'GET',
  headers: { 'Authorization': `Agent ${agentToken}` }
});
```

#### 2. Event-Driven Coordination
```typescript
// D1-based event coordination
interface AgentEvent {
  eventType: string;
  sourceAgent: string;
  targetAgent?: string;
  userId: string;
  payload: any;
  timestamp: string;
}
```

#### 3. Shared State Management
```typescript
// KV-based agent coordination
await env.AGENT_COORDINATION_KV.put(
  `agent:${agentId}:status`, 
  JSON.stringify({ status: 'healthy', lastSeen: Date.now() })
);
```

### Agent Discovery and Routing

#### Agent Registry
```typescript
interface AgentRegistry {
  agentId: string;
  agentType: 'insights' | 'optimization' | 'analysis' | 'preferences' | 'notification' | 'data';
  endpoint: string;
  healthStatus: 'healthy' | 'degraded' | 'offline';
  capabilities: string[];
  lastHeartbeat: string;
}
```

#### Request Routing
```typescript
class AgentRouter {
  async routeRequest(capability: string, request: Request): Promise<Response> {
    const agent = await this.findAgent(capability);
    return agent.handleRequest(request);
  }
}
```

### State Management Strategy

#### 1. Agent-Specific State
- Each agent manages its own Durable Object state
- No shared mutable state between agents
- Event sourcing for state synchronization

#### 2. Cross-Agent Coordination
- D1 database for coordination events
- KV store for fast agent discovery
- R2 for shared knowledge/cache

#### 3. User Session Management
- Distributed session state across agents
- Session affinity for WebSocket connections
- Graceful session migration on agent failures

## Migration Strategy

### Phase 1: Extract Services (Week 1)
- [ ] Extract existing handlers into separate agent files
- [ ] Implement HTTP-based inter-agent communication
- [ ] Create basic agent registry and discovery
- [ ] Update tests for new architecture

### Phase 2: Agent Independence (Week 2)  
- [ ] Separate Durable Object instances for each agent
- [ ] Implement event-driven coordination
- [ ] Add agent health monitoring
- [ ] Create CoordinatorAgent for orchestration

### Phase 3: Production Deployment (Week 3)
- [ ] Deploy agents independently
- [ ] Implement monitoring and alerting
- [ ] Performance testing and optimization
- [ ] Documentation and runbooks

### Phase 4: Advanced Features (Week 4)
- [ ] Cross-region agent deployment
- [ ] Advanced orchestration workflows
- [ ] Agent learning and adaptation
- [ ] Production optimization

## Benefits of Refactor

### ✅ Advantages
- **Single Responsibility**: Each agent has one clear purpose
- **Independent Scaling**: Scale agents based on demand
- **Fault Isolation**: Agent failures don't cascade
- **Development Velocity**: Teams can work on agents independently  
- **Technology Diversity**: Different agents can use optimal tech stacks
- **Easier Testing**: Focused, simple test suites per agent

### ❌ Trade-offs
- **Increased Complexity**: More moving parts to manage
- **Network Overhead**: Inter-agent communication latency
- **Operational Overhead**: More deployment and monitoring
- **Debugging Difficulty**: Distributed tracing required
- **Development Setup**: More complex local development

## Success Metrics

### Performance Metrics
- **Response Time**: < 200ms for single-agent requests
- **Multi-Agent Latency**: < 500ms for coordinated workflows
- **Agent Availability**: 99.9% uptime per agent
- **Error Rate**: < 0.1% agent communication failures

### Development Metrics  
- **Test Coverage**: > 90% per agent
- **Deployment Frequency**: Independent agent deployments
- **Mean Time to Recovery**: < 5 minutes for agent failures
- **Documentation Coverage**: Complete API docs per agent

## Risks and Mitigations

### Risk 1: Over-Engineering
**Mitigation**: Start with simple HTTP communication, add complexity only when needed

### Risk 2: Network Latency
**Mitigation**: Co-locate related agents, implement caching, optimize request patterns

### Risk 3: Coordination Complexity
**Mitigation**: Use proven patterns (event sourcing, CQRS), comprehensive testing

### Risk 4: Operational Overhead
**Mitigation**: Invest in monitoring tools, automation, clear runbooks

## Alternative Approaches

### Alternative 1: Keep Current Architecture
**Pros**: Simple, proven, working well  
**Cons**: Harder to scale individual features

### Alternative 2: Capability-Based Modules
**Pros**: Middle ground between monolith and microservices  
**Cons**: Still single deployment unit

### Alternative 3: Event-Driven Monolith
**Pros**: Event benefits without distribution complexity  
**Cons**: Single point of failure, harder independent scaling

## Decision Framework

**Proceed with refactor if**:
- Team grows beyond 2-3 developers
- Different scaling needs for different features
- Want to experiment with different technologies per agent
- Need fault isolation between capabilities

**Stick with current architecture if**:
- Small team (1-2 developers)
- Uniform scaling needs
- Want operational simplicity
- Current architecture meets all needs

---

## TODO List

### Pre-Work (Complete)
- [x] Complete agent learning path study
- [x] Research Cloudflare Workers agent patterns
- [x] Define agent boundaries and responsibilities  
- [x] Design inter-agent communication protocols

### Phase 1: Foundation
- [ ] Create agent project structure
- [ ] Implement basic agent registry
- [ ] Extract InsightsAgent from current codebase
- [ ] Create agent discovery service
- [ ] Implement HTTP-based agent communication
- [ ] Update tests for extracted agent

### Phase 2: Agent Extraction
- [ ] Extract OptimizationAgent
- [ ] Extract AnalysisAgent  
- [ ] Extract PreferencesAgent
- [ ] Extract NotificationAgent
- [ ] Create DataAgent for MCP communication
- [ ] Implement CoordinatorAgent

### Phase 3: Coordination
- [ ] Implement event-driven coordination
- [ ] Add agent health monitoring
- [ ] Create agent orchestration workflows
- [ ] Implement distributed session management
- [ ] Add comprehensive logging and tracing

### Phase 4: Production Ready
- [ ] Deploy agents independently
- [ ] Implement monitoring dashboards
- [ ] Create agent deployment pipelines
- [ ] Performance testing and optimization
- [ ] Create operational runbooks
- [ ] Update documentation

### Phase 5: Advanced Features
- [ ] Cross-region agent deployment
- [ ] Advanced orchestration patterns
- [ ] Agent learning and adaptation
- [ ] Performance optimization
- [ ] Security hardening

---

**Next Actions:**
1. Complete agent learning path (during time away)
2. Return and evaluate: proceed with refactor or continue with current architecture
3. If proceeding, start with Phase 1 foundation work
4. Regular architecture reviews as system grows

*This specification will be reviewed and updated based on learnings from the study phase and real-world usage patterns.*