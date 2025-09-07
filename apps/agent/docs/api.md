# Tides Agent API Reference

## Environment Variables

```bash
AGENT_BASE_URL=https://tides-agent-102.mpazbot.workers.dev
MCP_SERVER_URL=https://tides-006.mpazbot.workers.dev
```

## Available Endpoints

### POST /coordinator
**Primary endpoint** - All services (insights, optimize, questions, preferences, reports) use intelligent routing.

### POST /chat  
**Chat endpoint** - Conversational AI interface.

## Authentication

All requests require API key and tide ID in the request body:

```json
{
  "api_key": "tides_userId_randomId", 
  "tides_id": "your-tide-id"
}
```

## Service Examples

### Insights Service

**Request:**
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default",
  "service": "insights",
  "timeframe": "7d"
}
```

**Endpoint:** `POST ${AGENT_BASE_URL}/coordinator`

### Optimize Service

**Request:**
```json
{
  "api_key": "tides_userId_randomId", 
  "tides_id": "daily-tide-default",
  "service": "optimize",
  "preferences": {"focus_time_blocks": 90}
}
```

**Endpoint:** `POST ${AGENT_BASE_URL}/coordinator`

### Questions Service

**Request:**
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default", 
  "service": "questions",
  "question": "How can I improve my morning productivity?"
}
```

**Endpoint:** `POST ${AGENT_BASE_URL}/coordinator`

### Preferences Service

**Request:**
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default",
  "service": "preferences"
}
```

**Endpoint:** `POST ${AGENT_BASE_URL}/coordinator`

### Reports Service

**Request:**
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default",
  "service": "reports",
  "report_type": "summary",
  "period": "7d"
}
```

**Endpoint:** `POST ${AGENT_BASE_URL}/coordinator`

### Chat Service

**Request:**
```json
{
  "message": "How productive was I today?",
  "userId": "demo_user",
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default",
  "timestamp": "2025-09-07T17:30:00.000Z"
}
```

**Endpoint:** `POST ${AGENT_BASE_URL}/chat`

## Response Format

All successful responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Service-specific response data
  },
  "metadata": {
    "service": "service_name",
    "timestamp": "2025-09-07T17:30:00.000Z",
    "processing_time_ms": 123
  }
}
```

## Error Responses

```json
{
  "success": false,
  "error": "Error description",
  "metadata": {
    "service": "service_name", 
    "timestamp": "2025-09-07T17:30:00.000Z",
    "processing_time_ms": 0
  }
}
```

## cURL Examples

**Test insights service:**
```bash
curl -X POST ${AGENT_BASE_URL}/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your-api-key",
    "tides_id": "daily-tide-default",
    "service": "insights",
    "timeframe": "7d"
  }'
```

**Test chat service:**
```bash
curl -X POST ${AGENT_BASE_URL}/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How productive was I today?",
    "api_key": "your-api-key", 
    "tides_id": "daily-tide-default",
    "userId": "demo_user"
  }'
```