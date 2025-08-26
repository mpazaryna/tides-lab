# Tides Mobile Services Architecture

## Overview

The Tides mobile app implements a sophisticated service architecture designed for reliability, performance, and graceful degradation. This document provides a comprehensive guide to understanding and working with the services layer.

## Architecture Diagram

```
Mobile App Components
      ↓
Service Layer (this folder)
├── base/
│   ├── BaseService.ts          # Abstract HTTP client foundation
│   └── MCPService.ts          # JSON-RPC 2.0 MCP protocol client
├── agents/
│   ├── EnhancedAgentService.ts # Advanced reliability orchestration
│   ├── CircuitBreaker.ts      # Failure protection pattern
│   ├── ConnectionPoolManager.ts # Load balancing & health monitoring
│   ├── FallbackStrategy.ts    # Graceful degradation system
│   └── RequestQueueManager.ts # Offline capability (planned)
├── authService.ts             # Hybrid authentication system
├── mcpService.ts             # Singleton MCP client
├── agentService.ts           # Basic agent communication
├── LoggingService.ts         # Centralized structured logging
├── NotificationService.ts    # User feedback system
└── secureStorage.ts         # Encrypted credential storage
```

## Core Design Principles

### 1. Layered Architecture
- **BaseService**: Abstract foundation for all HTTP communication
- **Specialized Services**: Extend BaseService for specific domains
- **Reliability Layer**: Enhanced services with failure protection
- **Integration Layer**: Authentication and MCP protocol handling

### 2. Singleton Pattern
All services implement singleton pattern for consistent state management:

```typescript
class ServiceExample {
  private static instance: ServiceExample | null = null;
  
  static getInstance(): ServiceExample {
    if (!ServiceExample.instance) {
      ServiceExample.instance = new ServiceExample();
    }
    return ServiceExample.instance;
  }
}

export const serviceExample = ServiceExample.getInstance();
```

### 3. Event-Driven Communication
Services emit events for cross-service coordination:

```typescript
// Event emission
this.emitEvent("connection_established", { connectionId: "primary" });

// Event subscription
service.on("message_received", (data) => {
  // Handle event
});
```

## Service Detailed Documentation

### BaseService (Abstract Foundation)

**Location**: `base/BaseService.ts`

**Purpose**: Provides HTTP client functionality with authentication, retry logic, and response parsing for all services.

**Key Features**:
- Automatic authentication header injection
- Configurable retry logic with exponential backoff
- Response parsing (JSON, SSE, text, blob)
- Request timeout handling
- Structured logging integration

**Usage Pattern**:
```typescript
class MyService extends BaseService {
  constructor() {
    super({
      baseUrl: 'https://api.example.com',
      timeout: 30000,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryOn: [408, 429, 500, 502, 503, 504]
      }
    });
  }

  async getData(): Promise<any> {
    return this.get('/data'); // Inherits full BaseService functionality
  }
}
```

### Authentication Service

**Location**: `authService.ts`

**Purpose**: Manages hybrid authentication supporting both mobile and desktop clients.

**Authentication Tokens**:
- **Mobile**: `tides_{userId}_{randomId}` (short-lived, rotating)
- **Desktop**: `{uuid}` (long-lived, revocable)
- **Cross-client compatibility**: Both formats access same user data

**Key Methods**:
```typescript
// User authentication
await AuthService.signInWithEmail({ email, password });
await AuthService.signUpWithEmail({ email, password });

// API key management
const apiKey = await AuthService.getApiKey(); // Auto-generates if needed
await AuthService.setWorkerUrl(newUrl); // Update MCP server endpoint

// Server registration
await AuthService.registerApiKey(apiKey, userId, keyName);
```

**Worker URL Management**: Handles dynamic MCP server endpoint configuration with persistence.

### MCP Service Integration

**Location**: `base/MCPService.ts` (abstract) and `mcpService.ts` (singleton)

**Purpose**: JSON-RPC 2.0 protocol client for MCP server communication.

**Protocol Implementation**:
```typescript
// MCP Request Format
const mcpRequest = {
  jsonrpc: "2.0",
  id: ++this.requestId,
  method: "tools/call",
  params: {
    name: "tide_create", // Tool name
    arguments: { name: "My Tide", flow_type: "project" }
  }
};
```

**Available MCP Tools**:
1. `tide_create` - Create new tide workflows
2. `tide_list` - List existing tides
3. `tide_flow` - Manage tide flow states
4. `tide_add_energy` - Add energy measurements
5. `tide_link_task` - Link tasks to tides
6. `tide_list_task_links` - List task linkages
7. `tide_get_report` - Generate tide reports
8. `tides_get_participants` - Get tide participants

**Usage Example**:
```typescript
// Create a tide
const result = await mcpService.createTide(
  "Morning Routine",
  "Daily productivity tide",
  "daily"
);

// List all tides
const tides = await mcpService.listTides();

// Start flow session
const session = await mcpService.startTideFlow(
  tideId,
  "moderate", // intensity
  25,         // duration in minutes
  "high",     // energy level
  "Code review" // work context
);
```

### Agent Services

#### Basic Agent Service
**Location**: `agentService.ts`

**Purpose**: Simple HTTP client for agent endpoint communication.

**Features**:
- Direct question/answer interaction
- WebSocket support for real-time communication
- Insights and optimization requests
- Response format standardization

**Usage**:
```typescript
// Send message to agent
const response = await agentService.sendMessage(
  "Create a tide for my morning routine",
  { tideId: "optional", activeTides: [...] }
);

// Get insights
const insights = await agentService.getInsights(tideId);

// Request optimization
const optimization = await agentService.optimizeTide(tideId, preferences);
```

#### Enhanced Agent Service (Advanced)
**Location**: `agents/EnhancedAgentService.ts`

**Purpose**: Enterprise-grade agent communication with reliability patterns.

**Advanced Features**:
- Connection pooling with multiple endpoints
- Circuit breaker failure protection
- Request queuing for offline scenarios
- Intelligent fallback strategies
- Health monitoring and metrics
- Natural language command parsing

**Reliability Architecture**:
```typescript
// Initialize with multiple endpoints
await enhancedAgent.initialize(primaryUrl, [fallbackUrl1, fallbackUrl2]);

// Send message with reliability options
const response = await enhancedAgent.sendMessage(message, {
  timeout: 30000,
  priority: "high",
  fallbackAllowed: true
});

// Response includes metadata about reliability measures used
if (response.success) {
  console.log(`Processed in ${response.metadata.processingTime}ms`);
  console.log(`Connection: ${response.metadata.connectionId}`);
  console.log(`Fallback used: ${response.metadata.fallbackUsed}`);
}
```

### Reliability Components

#### Circuit Breaker
**Location**: `agents/CircuitBreaker.ts`

**Purpose**: Protects against cascading failures with automatic recovery.

**States**:
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Failures detected, requests blocked, fallback triggered
- **HALF_OPEN**: Testing recovery, limited requests allowed

**Configuration**:
```typescript
const circuitBreaker = new CircuitBreaker({
  failureRateThreshold: 0.5,    // 50% failure rate opens circuit
  openStateTimeout: 30000,      // 30s before attempting recovery
  slidingWindowSize: 100,       // Track last 100 calls
  halfOpenMaxCalls: 5,          // Max calls in half-open state
  enableSlowCallDetection: true,
  slowCallDuration: 5000,       // 5s is considered slow
  slowCallRateThreshold: 0.3    // 30% slow calls opens circuit
});
```

#### Connection Pool Manager
**Location**: `agents/ConnectionPoolManager.ts`

**Purpose**: Manages multiple connections with load balancing and health monitoring.

**Load Balancing Strategies**:
- **Round Robin**: Distribute requests evenly across connections
- **Least Connections**: Route to connection with fewest active requests
- **Weighted**: Prioritize by endpoint priority/weight
- **Random**: Random distribution

**Health Management**:
- Continuous health checks on configurable intervals
- Automatic connection recovery and marking
- Connection state tracking (connected, degraded, failed, disconnected)
- Metrics collection for performance monitoring

#### Fallback Strategy
**Location**: `agents/FallbackStrategy.ts`

**Purpose**: Provides graceful degradation when primary services fail.

**Fallback Chain** (priority order):
1. **MCP Direct**: Execute tide tools directly, bypassing agent processing
2. **Cache Fallback**: Return cached responses from previous successful calls
3. **Default Response**: Pattern-based helpful responses for common queries
4. **Queue Fallback**: Queue requests for processing when connection restores

**Pattern-Based Responses**: Recognizes common user intents and provides helpful guidance even when disconnected:

```typescript
// Example patterns
/create.*tide/i        → Tide creation guidance
/list.*tides?/i       → Tide listing alternatives
/help/i               → General help and commands
/add.*energy/i        → Energy tracking guidance
/status|connection/i  → Connection status information
```

### Logging Service

**Location**: `LoggingService.ts`

**Purpose**: Centralized structured logging with levels and unique codes.

**Features**:
- Structured logging with metadata
- Configurable log levels (debug, info, warn, error)
- Unique log codes for easy debugging
- Service name namespacing
- Conditional logging based on configuration

**Usage**:
```typescript
LoggingService.info(
  "ServiceName",
  "Operation completed successfully",
  { userId, duration: 150, success: true },
  "SVC_001" // Unique code for this log entry
);
```

### Notification Service

**Location**: `NotificationService.ts`

**Purpose**: Centralized user feedback system replacing direct Alert usage.

**Features**:
- Consistent notification formatting
- Multiple notification types (success, error, warning, info)
- Queue management for multiple notifications
- Integration with platform notification systems

## Configuration Management

All services support runtime configuration updates:

```typescript
// Update service configuration
service.updateConfig({
  timeout: 45000,
  retryPolicy: { maxAttempts: 5 }
});

// Get current configuration
const config = service.getConfig();
```

## Error Handling Patterns

### Structured Error Responses
```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    recoverable: boolean;
  };
  metadata: {
    processingTime: number;
    connectionId: string;
    fallbackUsed: boolean;
  };
}
```

### Recovery Strategies
1. **Automatic Retry**: Built into BaseService with exponential backoff
2. **Circuit Breaking**: Automatic failure detection and recovery testing
3. **Fallback Activation**: Graceful degradation to alternative responses
4. **Queue Processing**: Offline capability with request queuing

## Performance Optimizations

### Caching Strategy
- **Response Caching**: TTL-based caching with fuzzy matching for similar queries
- **Connection Pooling**: Reuse established connections to reduce overhead
- **Request Deduplication**: Avoid redundant network calls

### Background Operations
- **Health Monitoring**: Continuous endpoint health assessment
- **Cache Management**: Automatic cache cleanup and eviction
- **Queue Processing**: Background processing of queued requests

## Development Guidelines

### Adding New Services

1. **Extend BaseService** for HTTP functionality:
```typescript
class NewService extends BaseService {
  constructor() {
    super({ baseUrl: 'https://api.example.com' });
  }
}
```

2. **Implement Singleton Pattern**:
```typescript
private static instance: NewService | null = null;
static getInstance(): NewService { /* ... */ }
export const newService = NewService.getInstance();
```

3. **Add Structured Logging**:
```typescript
LoggingService.info("NewService", "Operation started", metadata, "NEW_001");
```

4. **Handle Errors Gracefully**:
```typescript
try {
  const result = await this.apiCall();
  return { success: true, data: result };
} catch (error) {
  LoggingService.error("NewService", "Operation failed", { error }, "NEW_002");
  return { success: false, error: { code: "API_ERROR", message: error.message } };
}
```

### Testing Services

- **Mock BaseService**: Override HTTP methods for unit testing
- **Test Error Paths**: Verify fallback and recovery mechanisms
- **Integration Tests**: Test service interactions and event handling
- **Performance Tests**: Verify timeout and retry behavior

### Service Integration

Services are designed to work together:

```typescript
// Services communicate through events
authService.on('auth_changed', (session) => {
  mcpService.updateAuthHeaders(session);
  agentService.reconnect();
});

// Services can depend on each other
class DependentService extends BaseService {
  async initialize() {
    await authService.waitForInitialization();
    this.apiKey = await authService.getApiKey();
  }
}
```

## Troubleshooting

### Common Issues

1. **Authentication Failures**:
   - Check API key generation in AuthService
   - Verify worker URL configuration
   - Ensure server registration completed

2. **Connection Issues**:
   - Review circuit breaker state
   - Check connection pool health
   - Verify endpoint configuration

3. **MCP Communication**:
   - Validate JSON-RPC 2.0 request format
   - Check tool name and parameter mapping
   - Review response parsing logic

### Debug Tools

- **Logging Codes**: Each service uses unique codes for easy log filtering
- **Service Metrics**: Health, performance, and usage metrics available
- **Configuration Inspection**: Runtime config viewing and updates
- **Event Monitoring**: Track service events and interactions

## Future Enhancements

### Planned Features
- **Advanced Natural Language Processing**: Better command parsing and intent recognition
- **Machine Learning Integration**: Predictive failure detection and optimization
- **Real-time Collaboration**: Multi-user tide management support
- **Advanced Analytics**: Detailed usage patterns and performance insights

### Architecture Evolution
- **Microservice Decomposition**: Further service separation for scalability
- **Event Sourcing**: Full audit trail of service interactions
- **CQRS Implementation**: Separate read/write models for complex operations
- **Distributed Caching**: Shared cache across service instances

## Contributing

When working with services:

1. **Follow Patterns**: Use established singleton and error handling patterns
2. **Add Documentation**: Update this README for new services or significant changes
3. **Include Tests**: Ensure adequate test coverage for new functionality
4. **Monitor Performance**: Consider impact on app startup and runtime performance
5. **Maintain Backward Compatibility**: Use configuration for breaking changes

For questions or clarifications, refer to the existing service implementations as examples of best practices.