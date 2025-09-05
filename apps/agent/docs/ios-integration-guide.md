# iOS Team Integration Guide - Tides Agent

## Overview

The Tides Agent is a **separate Cloudflare Worker** from the main MCP server, designed specifically for productivity analysis and AI-powered insights. 

**Architecture:**
- **MCP Server**: `https://tides-101.mpazbot.workers.dev/mcp` (existing tide management)
- **Tides Agent**: `https://tides-agent-101.mpazbot.workers.dev` (new productivity agent)

The agent acts as a **coordinator** that routes requests to internal micro-services for different productivity features.

## Agent Endpoints

### Base URL
```
https://tides-agent-101.mpazbot.workers.dev
```

### Health Check (No Auth Required)
```http
GET /             # Agent status and service list
GET /health       # Simple health check
```

### Coordinator Endpoints (Recommended)
All productivity services are accessed through the coordinator with **intelligent service inference**:

```http
POST /          # Main endpoint 
POST /coordinator  # Explicit coordinator endpoint (equivalent)
```

Both endpoints provide identical functionality - use either one.

**Standard Frontend Request Format** (recommended for production):
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default",
  "message": "Start me a flow session",
  "tide_tool_call": "tide_smart_flow",
  "context": {
    "recent_messages": [
      {"role": "user", "content": "How's my energy today?"},
      {"role": "assistant", "content": "Your energy seems steady..."}
    ],
    "user_time": "2025-09-05T12:00:00.000Z"
  },
  "timestamp": "2025-09-05T12:00:00.000Z"
}
```
*→ Routes to **chat service** for intelligent clarification and response*

**Testing with Explicit Service Override**:
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default", 
  "service": "insights",  // ← Add this field for unit testing
  "message": "Start me a flow session",
  "tide_tool_call": "tide_smart_flow",
  "context": {
    "recent_messages": [
      {"role": "user", "content": "How's my energy today?"},
      {"role": "assistant", "content": "Your energy seems steady..."}
    ],
    "user_time": "2025-09-05T12:00:00.000Z"
  },
  "timestamp": "2025-09-05T12:00:00.000Z"
}
```
*→ Routes directly to **insights service** (bypasses inference for testing)*

**Early Development Tip**: Include the `service` field during development for predictable routing, then remove it later to let the AI infer the correct service.

### Service Inference Rules

The coordinator **automatically detects** which service you need based on your request content:

| Field(s) | Inferred Service | Confidence | Purpose |
|----------|------------------|------------|---------|
| `service` (explicit) | **Any service** | **100%** | **Takes absolute precedence** |
| `question`, `query`, `ask` (high confidence) | questions | 95% | Specific productivity Q&A |
| `timeframe`, `focus_areas`, `trends` | insights | 80-95% | Productivity analytics |
| `report_type`, `period` | reports | 90% | Data export and summaries |
| `preferences`, `settings` | preferences | 85-90% | User configuration |
| `schedule`, `optimization`, `constraints` | optimize | 70-85% | Schedule optimization |
| **All other requests** | **chat** | **Default** | **Intent clarification & AI assistance** |

**Routing Logic**:
1. **Explicit service field** → Route directly (100% confidence)
2. **High confidence inference** (≥70%) → Route to specific service  
3. **Low/ambiguous confidence** (<70%) → Route to **chat service** for clarification

**Chat Service Benefits**:
- Handles ambiguous requests with intelligent clarification questions
- Provides contextual suggestions based on conversation history
- Future AI integration point for natural language understanding

### Legacy Direct Endpoints (Still Supported)
For backwards compatibility, direct service endpoints are still available:

```http
POST /insights      # Productivity insights and analysis
POST /optimize      # Schedule optimization recommendations  
POST /questions     # Custom productivity Q&A with AI
POST /preferences   # User preferences management
POST /reports       # Comprehensive productivity reports
POST /chat          # Intent clarification and AI assistance
```

**Chat Service Integration:**
The chat service provides AI-powered intent clarification when requests are ambiguous (confidence < 70%). It automatically engages when the coordinator cannot determine the appropriate service with high confidence.

## Authentication

**Same authentication as MCP server:**
- Use existing API keys from your React Native app
- Format: `tides_{userId}_{randomId}` (e.g., `tides_vm27ydanzrg_325FD3`)
- Keys are validated against KV storage with SHA-256 hashing

## Request Format

### Coordinator Endpoint (Recommended)
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "your-tide-id",
  "service": "insights",
  // ... additional service-specific fields
}
```

### Legacy Direct Endpoints
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "your-tide-id",
  // ... additional service-specific fields
}
```

## Response Format

All responses follow this consistent format:

```json
{
  "success": true,
  "data": { /* service response data */ },
  "metadata": {
    "service": "insights",
    "timestamp": "2024-01-01T00:00:00.000Z", 
    "processing_time_ms": 123
  }
}
```

**Error responses:**
```json
{
  "success": false,
  "error": "Invalid API key",
  "metadata": { /* ... */ }
}
```

## React Native Implementation

### Basic Setup

```typescript
const AGENT_BASE_URL = 'https://tides-agent-101.mpazbot.workers.dev';

interface AgentRequest {
  api_key: string;
  tides_id: string;
}

interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    service: string;
    timestamp: string;
    processing_time_ms: number;
  };
}
```

### Agent Service Class (Smart Inference)

```typescript
class TidesAgentService {
  private apiKey: string;
  private developmentMode: boolean; // For explicit service specification
  
  constructor(apiKey: string, developmentMode = false) {
    this.apiKey = apiKey;
    this.developmentMode = developmentMode;
  }

  private async makeRequest<T>(
    data: Record<string, any>,
    explicitService?: string
  ): Promise<AgentResponse<T>> {
    const requestBody: any = {
      api_key: this.apiKey,
      ...data
    };
    
    // Add explicit service in development mode for predictable routing
    if (this.developmentMode && explicitService) {
      requestBody.service = explicitService;
    }
    
    const response = await fetch(`${AGENT_BASE_URL}/coordinator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    return await response.json();
  }

  // Service auto-inferred from 'timeframe' field (or explicit in dev mode)
  async getInsights(tidesId: string, timeframe = '7d') {
    return this.makeRequest({ 
      tides_id: tidesId, 
      timeframe 
    }, 'insights');
  }

  // Service auto-inferred from 'schedule'/'optimization' fields (or explicit in dev mode)
  async getOptimization(tidesId: string) {
    return this.makeRequest({ 
      tides_id: tidesId,
      optimization: true 
    }, 'optimize');
  }

  // Service auto-inferred from 'question' field (or explicit in dev mode)
  async askQuestion(tidesId: string, question: string) {
    return this.makeRequest({ 
      tides_id: tidesId, 
      question 
    }, 'questions');
  }

  // Service auto-inferred from 'preferences' field (or explicit in dev mode)
  async getPreferences(tidesId: string) {
    return this.makeRequest({ 
      tides_id: tidesId,
      preferences: {} // Empty preferences object = GET request
    }, 'preferences');
  }

  async updatePreferences(tidesId: string, preferences: any) {
    return this.makeRequest({ 
      tides_id: tidesId, 
      preferences 
    }, 'preferences');
  }

  // Service auto-inferred from 'report_type' field (or explicit in dev mode)
  async generateReport(tidesId: string, reportType = 'summary', period = '30d') {
    return this.makeRequest({ 
      tides_id: tidesId, 
      report_type: reportType, 
      period 
    }, 'reports');
  }

  // Chat service for ambiguous requests or explicit AI assistance
  async getChatResponse(tidesId: string, message: string, conversationId?: string) {
    return this.makeRequest({ 
      tides_id: tidesId, 
      message,
      conversation_id: conversationId 
    }, 'chat');
  }
}
```

### Usage Example

```typescript
// Production: Let AI infer service from content
const prodService = new TidesAgentService('tides_vm27ydanzrg_325FD3', false);

// Development: Always use explicit service for predictable routing  
const devService = new TidesAgentService('tides_vm27ydanzrg_325FD3', true);

// Get productivity insights
const insights = await prodService.getInsights('tide-123');
if (insights.success) {
  console.log('Productivity Score:', insights.data.productivity_score);
  console.log('Recommendations:', insights.data.recommendations);
  
  // Check inference info (only present if auto-inferred)
  if (insights.metadata.inference) {
    console.log('Service inferred with', insights.metadata.inference.confidence, '% confidence');
  }
}

// Ask a question - service auto-detected from 'question' field
const answer = await prodService.askQuestion(
  'tide-123', 
  'How can I improve my morning productivity?'
);

// Development mode example - explicit service override
const devDirectResponse = await fetch('https://tides-agent-101.mpazbot.workers.dev/coordinator', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: 'tides_vm27ydanzrg_325FD3',
    tides_id: 'tide-123',
    service: 'insights',           // Explicit override
    question: 'What are my peak productivity hours?',
    timeframe: '30d'
    // Routes to 'insights' service despite having 'question' field
  })
});
```

## Testing the Agent

### 1. Health Check
```bash
curl https://tides-agent-101.mpazbot.workers.dev/
```

### 2. Test Smart Insights Inference (Mock Data)
```bash
curl -X POST https://tides-agent-101.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "tides_id": "test-tide-123",
    "timeframe": "7d"
  }'
```
*Service auto-detected as 'insights' from 'timeframe' field*

### 3. Test Smart Questions Inference (Mock Data)  
```bash
curl -X POST https://tides-agent-101.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY", 
    "tides_id": "test-tide-123",
    "question": "How can I improve focus during deep work?"
  }'
```
*Service auto-detected as 'questions' from 'question' field*

### 4. Test Service Precedence (Development Override)
```bash
curl -X POST https://tides-agent-101.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "tides_id": "test-tide-123",
    "service": "insights",
    "question": "How can I improve focus?",
    "timeframe": "7d"
  }'
```
*Routes to 'insights' service despite 'question' field (explicit override)*

### 5. Test Ambiguous Request (Shows Suggestion)
```bash
curl -X POST https://tides-agent-101.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "YOUR_API_KEY",
    "tides_id": "test-tide-123"
  }'
```
*Returns helpful error with service suggestion*

## Current Implementation Status

### ✅ Production Implementation (Live Now)
- **All services fully operational** with real R2 tide data integration
- **Chat service with Cloudflare Workers AI** for intelligent responses
- **Authentication system** with SHA-256 API key validation
- **Test coverage**: 84.48% for services, 68.37% overall (187 passing tests)
- **Performance**: 50-600ms response times depending on service complexity
- **Durable Objects architecture** with persistent state management

### ✅ Completed Features
- Real R2 tide data integration ✅
- Workers AI for chat service responses ✅  
- Sophisticated productivity calculations and analytics ✅
- Persistent user preferences in KV storage ✅
- Service inference engine with confidence scoring ✅

## Integration Notes

1. **Same Auth Flow**: Use your existing API key management
2. **Smart Routing**: No need to specify 'service' field - inferred from content
3. **Error Handling**: Check `response.success` before accessing `data`
4. **Inference Metadata**: Check `response.metadata.inference` for auto-inference info
5. **Consistent Format**: All services follow the same request/response pattern
6. **Production Data**: All responses use real tide data from R2 storage
7. **Independent Service**: Agent calls don't affect MCP server operations  
8. **Backwards Compatible**: Explicit 'service' field still works if needed
9. **AI Integration**: Chat service provides intelligent conversation capabilities

## Support

The agent is deployed to production environment and fully operational. All services return real productivity data integrated with your existing tides infrastructure.

**Status:** Production ready with all features operational  
**Last Updated:** September 2025  
**Test Coverage:** 84.48% services, 68.37% overall