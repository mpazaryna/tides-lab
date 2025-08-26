# Agent Chat Integration Specification

## Overview

This specification outlines the implementation of a comprehensive agent-chat system that integrates conversational AI agents with MCP (Model Context Protocol) tools within the Tides mobile application. The system maintains the existing `tides_{userId}_{randomId}` authentication pattern while adding agent communication and MCP tool access.

## Architecture Requirements

### 1. Agent-MCP Integration Flow

```
Mobile App ←→ Agent Service ←→ MCP Tools
     ↓              ↓            ↓
  Auth Service → Bearer Token → Server Validation
```

**Authentication Chain:**

- Mobile authenticates via existing Supabase flow
- Generates `tides_{userId}_{randomId}` API key
- Agent service uses same API key for MCP tool calls
- Server validates API key and grants full tool access

### 2. Connection Architecture

**Primary Connections:**

1. **User ↔ Mobile App**: UI interaction, conversational interface
2. **Mobile App ↔ Agent Service**: Message passing, command execution
3. **Agent Service ↔ MCP Server**: Tool calls using established auth
4. **Mobile App ↔ MCP Server**: Direct tool calls for shortcuts (bypassing agent)

## Implementation Tasks

### Phase 1: Agent Service Foundation

#### Task 1.1: Create Enhanced Agent Service (`apps/mobile/src/services/agentService.ts`)

**Requirements:**

- Extend existing BaseService pattern
- Use singleton pattern with loggingServiceintegration
- Implement connection pooling and circuit breaker patterns
- Support HTTP-based agent communication

**Implementation Steps:**

```typescript
class AgentService extends BaseService {
  // Connection management
  async connectToAgent(): Promise<boolean>;
  async disconnectFromAgent(): Promise<void>;

  // Message handling
  async sendMessage(message: string): Promise<string>;
  async sendCommand(command: AgentCommand): Promise<AgentResponse>;

  // MCP tool integration
  async callMCPTool(toolName: string, params: any): Promise<any>;

  // Status monitoring
  getConnectionStatus(): ConnectionStatus;
  getAgentHealth(): AgentHealthStatus;
}
```

#### Task 1.2: Create Agent Context (`apps/mobile/src/context/AgentContext.tsx`)

**Requirements:**

- Use useReducer pattern (following AuthContext pattern)
- Manage agent connection state
- Handle real-time agent communication
- Track MCP tool call history

**State Management:**

```typescript
interface AgentState {
  isConnected: boolean;
  connectionStatus: "connecting" | "connected" | "disconnected" | "error";
  currentAgent: Agent | null;
  mcpConnectionStatus: "connecting" | "connected" | "disconnected" | "error";
  lastToolCall: MCPToolCall | null;
  conversationHistory: Message[];
  error: string | null;
}
```

#### Task 1.3: MCP Service Integration (`apps/mobile/src/services/mcpService.ts`)

**Requirements:**

- Implement direct MCP tool calling capability
- Use existing `tides_{userId}_{randomId}` authentication
- Support all 8 tide tools from server
- Implement retry logic and error handling

**Available MCP Tools:**

1. `tide_create` - Create new tide workflows
2. `tide_list` - List existing tides
3. `tide_flow` - Manage tide flow states
4. `tide_add_energy` - Add energy measurements
5. `tide_link_task` - Link tasks to tides
6. `tide_list_task_links` - List task linkages
7. `tide_get_report` - Generate tide reports
8. `tides_get_participants` - Get tide participants

### Phase 2: User Interface Components

#### Task 2.1: Agent Connection Monitor (`apps/mobile/src/components/agents/ConnectionMonitor.tsx`)

**Requirements:**

- Real-time connection status display
- Visual indicators for all connection states
- Connection health metrics

**Status Indicators:**

```typescript
interface ConnectionIndicators {
  agentConnected: boolean;
  mcpServerConnected: boolean;
  authStatus: "authenticated" | "unauthenticated" | "expired";
  agentMcpBridge: "connected" | "disconnected" | "error";
}
```

#### Task 2.2: Debug Testing Interface (`apps/mobile/src/components/debug/TestingPanel.tsx`)

**Requirements:**

- Manual trigger buttons for each MCP tool
- Connection test buttons
- Real-time log display
- JSON response viewer

**Debug Controls:**

- Test agent connection
- Test MCP server connection
- Test individual MCP tools
- View authentication status
- Display connection logs
- Export debug information

#### Task 2.3: Shortcut Button Bar (`apps/mobile/src/components/chat/ShortcutBar.tsx`)

**Requirements:**

- Configurable shortcut buttons
- Support both agent commands and direct MCP calls
- Visual distinction between shortcut types

**Shortcut Types:**

```typescript
interface Shortcut {
  id: string;
  label: string;
  type: "agent_command" | "mcp_direct";
  command: string;
  icon?: string;
  params?: any;
}
```

**Pre-configured Shortcuts:**

- "Generate Insight" → Agent command for analysis
- "List Tides" → Direct MCP call to `tide_list`
- "Create Tide" → Agent-assisted tide creation
- "Get Report" → Direct MCP call to `tide_get_report`

### Phase 3: Chat Interface Enhancement

#### Task 3.1: Enhanced Chat Screen (`apps/mobile/src/screens/Main/Chat.tsx`)

**Requirements:**

- Maintain existing conversational interface
- Integrate shortcut button bar at top
- Show agent/MCP connection status
- Display conversation history with agent responses

**Message Flow:**

1. User types message OR presses shortcut
2. If shortcut → autofill in message input
3. If typed message → send to agent for processing
4. Agent determines if MCP tools needed
5. Display results in conversational format

#### Task 3.2: Message Components (`apps/mobile/src/components/chat/`)

**Components Needed:**

- `MessageBubble.tsx` - User and agent messages
- `ToolCallIndicator.tsx` - Show when MCP tools are being called
- `LoadingIndicator.tsx` - Agent thinking/processing state
- `ErrorMessage.tsx` - Connection or execution errors

### Phase 4: Authentication Integration

#### Task 4.1: Extend AuthService (`apps/mobile/src/services/authService.ts`)

**Current State:** Already implements `tides_{userId}_{randomId}` pattern
**Required Additions:**

```typescript
// Add agent-specific authentication methods
async getAgentAuthToken(): Promise<string | null>
async validateAgentConnection(): Promise<boolean>
async refreshAgentCredentials(): Promise<void>
```

#### Task 4.2: Agent Authentication Flow

**Flow:**

1. User authenticates via existing Supabase flow
2. AuthService generates `tides_{userId}_{randomId}` API key
3. AgentService uses same API key for agent communication
4. Agent service forwards API key to MCP tools
5. Server validates using existing `validateApiKey()` function

### Phase 5: Backend Integration

#### Task 5.1: Server-Side Agent Endpoints (`apps/server/src/handlers/agents.ts`)

**Required Endpoints:**

```typescript
// Agent communication endpoints
POST /agent/connect
POST /agent/message
POST /agent/command
GET /agent/status

// MCP tool proxy endpoints (for direct calls)
POST /mcp/tool/:toolName
GET /mcp/tools/list
```

#### Task 5.2: Agent-MCP Bridge Service (`apps/server/src/services/agentBridge.ts`)

**Requirements:**

- Route agent requests to appropriate MCP tools
- Maintain authentication context
- Log all tool calls for debugging
- Handle tool call failures gracefully

## Testing Requirements

### Connection Testing

- [ ] Agent connection establishment
- [ ] MCP server connection via existing auth
- [ ] Agent-to-MCP tool calling chain
- [ ] Direct MCP tool calls from mobile
- [ ] Authentication token validation
- [ ] Connection failure recovery

### UI Testing

- [ ] Shortcut button functionality
- [ ] Debug panel tool triggers
- [ ] Connection status indicators
- [ ] Conversational interface preservation
- [ ] Error message display
- [ ] Loading state management

### Integration Testing

- [ ] End-to-end agent conversation
- [ ] MCP tool execution via agent
- [ ] Direct MCP tool execution
- [ ] Authentication flow validation
- [ ] Multi-user session isolation
- [ ] Connection state persistence

## Development Order

### Week 1: Foundation

1. Create AgentService with connection management
2. Implement AgentContext with state management
3. Extend MCPService for direct tool calling
4. Add authentication extensions

### Week 2: UI Components

1. Build ConnectionMonitor component
2. Create debug TestingPanel
3. Implement ShortcutBar component
4. Design chat message components

### Week 3: Integration

1. Integrate agent service with chat interface
2. Connect shortcuts to agent/MCP calls
3. Implement debug panel functionality
4. Add connection status monitoring

### Week 4: Testing & Polish

1. End-to-end testing of all flows
2. Error handling and edge cases
3. Performance optimization
4. User experience refinement

## Success Criteria

### Functional Requirements

- [ ] Users can send messages to agents conversationally
- [ ] Agents can call all 8 MCP tools autonomously
- [ ] Shortcuts provide quick access to common functions
- [ ] Debug interface allows manual testing of all connections
- [ ] Connection status is always visible and accurate
- [ ] Authentication uses existing `tides_{userId}_{randomId}` pattern

### Technical Requirements

- [ ] All connections are "bulletproof" with retry logic
- [ ] Connection failures are handled gracefully
- [ ] Debug information is easily accessible
- [ ] Performance impact is minimal
- [ ] Code follows existing patterns and conventions

### User Experience Requirements

- [ ] Conversational interface feels natural
- [ ] Shortcuts are discoverable and useful
- [ ] Connection issues are clearly communicated
- [ ] Debug tools help troubleshoot problems
- [ ] Overall interface remains intuitive

## Notes

- **Agent Technology**: Implementation details for agent communication protocol to be determined based on preferred agent framework
- **MCP Tool Access**: Agents have full permission to all tools - no additional authorization required
- **Authentication**: Leverage existing proven auth patterns - no new authentication mechanisms needed
- **Error Handling**: Prioritize graceful degradation when connections fail
- **Performance**: Monitor impact on app startup and battery usage
