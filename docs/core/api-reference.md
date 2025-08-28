# Tides API Reference - Complete Agent & MCP Documentation

## Table of Contents
- [Overview](#overview)
- [Authentication](#authentication)
- [Agents](#agents)
  - [TideProductivityAgent](#tideproductivityagent)
  - [HelloAgent](#helloagent)
- [MCP Tools](#mcp-tools)
  - [Core Tide Management](#core-tide-management)
  - [AI-Powered Tools](#ai-powered-tools)
  - [System Tools](#system-tools)
- [MCP Prompts](#mcp-prompts)
- [MCP Resources](#mcp-resources)
- [Mobile App Integration](#mobile-app-integration)
- [Usage Examples](#usage-examples)

---

## Overview

Tides provides a comprehensive API ecosystem with AI-powered agents and MCP (Model Context Protocol) tools for productivity and workflow management. The system consists of:

- **2 Durable Object Agents** for real-time AI interactions
- **11 MCP Tools** for workflow management
- **13 MCP Prompts** for customizable analysis
- **1 MCP Resource** for configuration access

### Base URL
```
Production: https://tides-006.mpazbot.workers.dev
```

---

## Authentication

All endpoints require Bearer token authentication:

```http
Authorization: Bearer <api_key>
```

**API Key Formats:**
- Mobile: `tides_{userId}_{randomId}`
- Desktop: UUID format
- Test: `tides_testuser_001`

---

## Agents

### TideProductivityAgent

**Purpose**: AI-powered productivity assistant with conversational capabilities and workflow optimization.

**Base URL**: `https://tides-006.mpazbot.workers.dev/agents/tide-productivity/`

#### Endpoints

##### `/question` - Conversational AI Chat
**Method**: `POST`

**Description**: Engage in natural conversation with the AI assistant about productivity, workflow management, and general assistance.

**Request Body**:
```json
{
  "userId": "string",
  "question": "string",
  "context": {
    "tideId": "string (optional)",
    "activeTides": "array (optional)"
  },
  "timestamp": "ISO 8601 string"
}
```

**Response**:
```json
{
  "success": true,
  "result": {
    "message": "AI response text",
    "confidence": 0.8,
    "actionable": true,
    "conversationType": "general",
    "question": "original question"
  },
  "debug": {
    "mcpServerInitialized": true,
    "aiAvailable": true,
    "tideId": "auto-selected or provided"
  }
}
```

**Example**:
```bash
curl -X POST "https://tides-006.mpazbot.workers.dev/agents/tide-productivity/question" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tides_testuser_001" \
  -d '{
    "userId": "testuser001",
    "question": "How can I improve my focus?",
    "timestamp": "2025-08-16T12:00:00Z"
  }'
```

##### `/insights` - Productivity Insights
**Method**: `POST`

**Description**: Get AI-generated insights about productivity patterns and recommendations.

**Request Body**:
```json
{
  "userId": "string",
  "tideId": "string (optional)",
  "timestamp": "ISO 8601 string"
}
```

##### `/optimize` - Workflow Optimization
**Method**: `POST`

**Description**: Get AI-powered optimization suggestions for specific tides or workflows.

**Request Body**:
```json
{
  "userId": "string",
  "tideId": "string",
  "timestamp": "ISO 8601 string"
}
```

##### `/preferences` - User Preferences
**Method**: `POST`

**Description**: Manage user preferences for AI personalization.

**Request Body**:
```json
{
  "userId": "string",
  "preferences": {
    "work_style": "string",
    "preferred_times": "array",
    "energy_patterns": "object"
  },
  "timestamp": "ISO 8601 string"
}
```

##### `/status` - Health Check
**Method**: `GET`

**Description**: Check agent health and status.

**Response**:
```json
{
  "status": "healthy",
  "agentId": "string",
  "connectedClients": 0,
  "timestamp": "ISO 8601 string",
  "uptime": 0
}
```

##### WebSocket Endpoint
**URL**: `ws://tides-006.mpazbot.workers.dev/agents/tide-productivity/ws`

**Description**: Real-time bidirectional communication for live updates and streaming responses.

### HelloAgent

**Purpose**: Simple demo agent for testing and basic interactions.

**Base URL**: `https://tides-006.mpazbot.workers.dev/agents/hello/`

---

## MCP Tools

MCP tools are accessed via the main MCP endpoint using JSON-RPC 2.0 protocol.

**Endpoint**: `https://tides-006.mpazbot.workers.dev/mcp`

**Headers**:
```http
Content-Type: application/json
Accept: application/json, text/event-stream
Authorization: Bearer <api_key>
```

**Request Format**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "tool_name",
    "arguments": {}
  }
}
```

### Core Tide Management

#### 1. `tide_create`
**Purpose**: Create a new tidal workflow for rhythmic productivity.

**Arguments**:
```json
{
  "name": "string (required)",
  "flow_type": "daily|weekly|project|seasonal (required)",
  "description": "string (optional)"
}
```

**Returns**: Tide ID and scheduling information.

#### 2. `tide_list`
**Purpose**: List all tidal workflows with optional filtering.

**Arguments**:
```json
{
  "flow_type": "string (optional)",
  "active_only": "boolean (optional)"
}
```

**Returns**: Array of tide summaries with flow counts and timestamps.

#### 3. `tide_flow`
**Purpose**: Start or continue a focused work session (Pomodoro/focus).

**Arguments**:
```json
{
  "tide_id": "string (required)",
  "intensity": "gentle|moderate|strong (optional, default: moderate)",
  "duration": "number (optional, default: 25)",
  "initial_energy": "string (optional)",
  "work_context": "string (optional)"
}
```

**Returns**: Session details for timer UI components.

#### 4. `tide_add_energy`
**Purpose**: Record energy level check-in for mood and energy tracking.

**Arguments**:
```json
{
  "tide_id": "string (required)",
  "energy_level": "string (required)",
  "context": "string (optional)"
}
```

**Returns**: Energy ID for tracking progression.

#### 5. `tide_link_task`
**Purpose**: Link external tasks (GitHub, Obsidian, Linear) to a tide.

**Arguments**:
```json
{
  "tide_id": "string (required)",
  "task_url": "string (required)",
  "task_title": "string (required)",
  "task_type": "string (optional)"
}
```

**Returns**: Link confirmation and ID.

#### 6. `tide_list_task_links`
**Purpose**: List all external tasks linked to a specific tide.

**Arguments**:
```json
{
  "tide_id": "string (required)"
}
```

**Returns**: Array of linked tasks with metadata.

#### 7. `tide_get_report`
**Purpose**: Generate comprehensive tide reports in multiple formats.

**Arguments**:
```json
{
  "tide_id": "string (required)",
  "format": "json|markdown|csv (optional, default: json)"
}
```

**Returns**: Formatted report data.

#### 8. `tide_get_raw_json`
**Purpose**: Retrieve complete raw JSON data for a tide from storage.

**Arguments**:
```json
{
  "tide_id": "string (required)"
}
```

**Returns**: Complete tide data including all nested arrays.


### System Tools

#### 9. `tides_get_participants`
**Purpose**: Get participants from database for multi-user support.

**Arguments**:
```json
{
  "status_filter": "string (optional)",
  "date_from": "ISO string (optional)",
  "date_to": "ISO string (optional)",
  "limit": "number (optional, default: 100)"
}
```

**Returns**: Participant list for team collaboration.

#### 10. `auth_validate_key`
**Purpose**: Validate an API key and return user information.

**Arguments**:
```json
{
  "api_key": "string (required)"
}
```

**Returns**: User details or error information.

#### 11. `roll_dice`
**Purpose**: Test tool - rolls an N-sided dice.

**Arguments**:
```json
{
  "sides": "integer (minimum: 2)"
}
```

**Returns**: Random number result.

---

## MCP Prompts

MCP prompts provide pre-configured analysis templates.

**Endpoint**: `https://tides-006.mpazbot.workers.dev/mcp`

**Method**: `prompts/get`

### Available Prompts

1. **`analyze_tide`** - Comprehensive tide analysis for productivity patterns
2. **`custom_tide_analysis`** - Flexible analysis for specific questions
3. **`optimize_energy`** - Energy management recommendations
4. **`productivity_insights`** - Time-based performance analysis
5. **`team_insights`** - Collaborative workflow analysis
6. **`review_code`** - Code review template (demo)

### Prompt Parameters
- `tide_id` - Specific tide to analyze
- `analysis_depth` - Level of analysis detail
- `analysis_question` - Custom question for analysis
- `time_period` - Time range for analysis
- `date_range` - Specific date range
- `focus_areas` - Areas to focus analysis on
- `output_format` - Desired output format

---

## MCP Resources

### `app://config`
**Purpose**: Application configuration data access.

**Access Method**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "resources/read",
  "params": {
    "uri": "app://config"
  }
}
```

---

## Mobile App Integration

### React Native Service Setup

```typescript
// mcpService.ts
class MCPService {
  async callTool(name: string, args?: any) {
    return this.request('tools/call', { 
      name, 
      arguments: args || {} 
    });
  }
}
```

### Agent Service Setup

```typescript
// agentService.ts
class AgentService {
  async sendMessage(message: string, context?: TideContext) {
    return this.makeRequest("question", "POST", {
      userId,
      question: message,
      context,
      timestamp: new Date().toISOString()
    });
  }
}
```

---

## Usage Examples

### Example 1: Create and Start a Flow Session

```javascript
// Create a new tide
const tide = await mcpService.callTool('tide_create', {
  name: "Morning Focus Work",
  flow_type: "daily",
  description: "Deep work on project tasks"
});

// Start a flow session
const session = await mcpService.callTool('tide_flow', {
  tide_id: tide.id,
  intensity: "strong",
  duration: 45,
  initial_energy: "high",
  work_context: "Feature development"
});
```

### Example 2: Generate Tide Report

```javascript
// Generate a report
const report = await mcpService.callTool('tide_get_report', {
  tideId: currentTideId,
  format: 'summary'
});

console.log(report.summary);
console.log(report.energy_analysis);
```

### Example 3: Chat with AI Assistant

```javascript
// Send message to conversational AI
const response = await agentService.sendMessage(
  "What's the best time for me to do creative work?",
  { tideId: currentTideId }
);

console.log(response.message); // AI's response
```

### Example 4: Real-time WebSocket Connection

```javascript
const ws = new WebSocket('wss://tides-006.mpazbot.workers.dev/agents/tide-productivity/ws');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'subscribe',
    userId: 'user123'
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Real-time update:', data);
};
```

---

## Response Formats

### Success Response
```json
{
  "success": true,
  "result": {
    // Tool-specific data
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": -32000,
    "message": "Error description"
  },
  "jsonrpc": "2.0",
  "id": 1
}
```

### Server-Sent Events Format
```
event: message
data: {"result": {...}, "jsonrpc": "2.0", "id": 1}
```

---

## Rate Limits & Performance

- **AI Tools**: ~500ms for quick analysis, ~2s for detailed
- **Regular Tools**: <100ms response time
- **WebSocket**: Real-time with <50ms latency
- **Caching**: 15-30 minute TTL for AI responses

---

## Error Codes

| Code | Description |
|------|-------------|
| -32600 | Invalid Request |
| -32601 | Method not found |
| -32602 | Invalid params |
| -32603 | Internal error |
| -32000 | Server error |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## Version History

- **v1.0.0** - Initial release with core tide management
- **v1.5.0** - Added AI-powered tools
- **v1.6.0** - Conversational AI agent integration
- **v1.7.0** - Enhanced system prompts and fallback responses

---

## Support & Documentation

- **GitHub**: https://github.com/mpazaryna/tides-server
- **Mobile App**: https://github.com/masonomara/TidesMobile
- **Web App**: https://github.com/masonomara/tides-app-bare

---

*Last Updated: August 16, 2025*