# Tides Agent - iOS Integration Guide

## Mock Coordinator Endpoint

**Base URL**: `https://tides-agent-101.mpazbot.workers.dev`

**Authentication**: Mock authentication - accepts ANY api_key and ANY tides_id
**Environment**: TDD Development environment with consistent mock responses

⚠️ **Important**: This is a mock environment for iOS development. You can use:
- **Any API key**: `"test"`, `"abc123"`, `"ios-dev-key"`, etc.
- **Any Tides ID**: `"tide-1"`, `"test-tide"`, `"anything"`, etc.

## Available Services

All services can be accessed via the coordinator endpoint using either:
1. **Service inference** (recommended): Send request to `/` and let coordinator determine service
2. **Direct routing**: Send request to `/coordinator` with explicit `service` field

### 1. Insights Service

Get productivity insights and analysis.

```http
POST https://tides-agent-101.mpazbot.workers.dev
Content-Type: application/json

{
  "api_key": "literally-any-string",
  "tides_id": "any-tide-id",
  "service": "insights",
  "timeframe": "30d"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productivity_score": 73,
    "recommendations": [
      "Consider scheduling deep work during your peak hours (9-11 AM)",
      "Take more frequent breaks to maintain energy levels",
      "Group similar tasks together to reduce context switching",
      "Use time-blocking for better focus management"
    ],
    "trends": {
      "daily_average": 88,
      "improvement_areas": ["Morning focus sessions", "Afternoon energy management", "Task prioritization"],
      "weekly_pattern": [75, 80, 85, 78, 82, 68, 72]
    }
  },
  "metadata": {
    "service": "insights",
    "timestamp": "2025-09-05T02:03:36.351Z",
    "processing_time_ms": 51
  }
}
```

### 2. Optimize Service

Get schedule optimization recommendations.

```http
POST https://tides-agent-101.mpazbot.workers.dev
Content-Type: application/json

{
  "api_key": "literally-any-string",
  "tides_id": "any-tide-id",
  "service": "optimize",
  "preferences": {
    "work_hours": { "start": "09:00", "end": "17:00" },
    "break_duration": 15
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggested_schedule": {
      "time_blocks": [
        {
          "start": "09:00",
          "end": "10:30",
          "activity": "Deep Work - High Priority Tasks",
          "priority": 1
        },
        {
          "start": "10:30",
          "end": "10:45",
          "activity": "Break",
          "priority": 3
        },
        {
          "start": "10:45",
          "end": "12:00",
          "activity": "Collaborative Work",
          "priority": 2
        }
      ]
    },
    "efficiency_gains": {
      "estimated_time_saved": 45,
      "focus_improvement": 25
    }
  },
  "metadata": {
    "service": "optimize",
    "timestamp": "2025-09-05T02:03:36.444Z",
    "processing_time_ms": 93
  }
}
```

### 3. Questions Service

Get answers to productivity questions.

```http
POST https://tides-agent-101.mpazbot.workers.dev
Content-Type: application/json

{
  "api_key": "literally-any-string",
  "tides_id": "any-tide-id",
  "service": "questions",
  "question": "How can I improve my morning productivity?"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Based on your productivity patterns, here are some strategies to improve your morning productivity: Start with your most challenging tasks when your mental energy is highest (typically 9-11 AM). Establish a consistent morning routine that includes a brief planning session to prioritize your day. Consider time-blocking your most important work for the first 2-3 hours of your workday. Take short breaks every 90 minutes to maintain focus and avoid mental fatigue.",
    "confidence": 92,
    "related_insights": [
      "Your productivity peaks at 9:30 AM based on historical data",
      "Morning deep work sessions show 35% higher completion rates"
    ],
    "suggested_actions": [
      "Block 9:00-11:00 AM for high-priority tasks",
      "Avoid meetings before 10:30 AM when possible",
      "Use the first 15 minutes to plan your day",
      "Take a 10-minute break at 10:30 AM"
    ]
  },
  "metadata": {
    "service": "questions",
    "timestamp": "2025-09-05T02:03:36.531Z",
    "processing_time_ms": 87
  }
}
```

### 4. Preferences Service

Update or retrieve user preferences.

```http
POST https://tides-agent-101.mpazbot.workers.dev
Content-Type: application/json

{
  "api_key": "literally-any-string",
  "tides_id": "any-tide-id",
  "service": "preferences",
  "preferences": {
    "work_hours": { "start": "08:30", "end": "16:30" },
    "break_duration": 20
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "work_hours": { "start": "08:30", "end": "16:30" },
    "break_duration": 20,
    "focus_time_blocks": 3,
    "notification_preferences": {
      "insights": true,
      "optimization": true,
      "reminders": false
    }
  },
  "metadata": {
    "service": "preferences",
    "timestamp": "2025-09-05T02:03:36.572Z",
    "processing_time_ms": 41
  }
}
```

### 5. Reports Service

Generate productivity reports.

```http
POST https://tides-agent-101.mpazbot.workers.dev
Content-Type: application/json

{
  "api_key": "literally-any-string",
  "tides_id": "any-tide-id",
  "service": "reports",
  "report_type": "summary",
  "period": "30d"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report_type": "summary",
    "period": "30d",
    "summary": {
      "total_productive_hours": 142,
      "average_daily_score": 78,
      "completed_tasks": 89,
      "focus_sessions": 45
    },
    "detailed_metrics": {
      "productivity_trends": [75, 82, 78, 85, 88, 79, 83],
      "time_distribution": {
        "deep_work": 45,
        "meetings": 25,
        "admin_tasks": 20,
        "breaks": 10
      },
      "energy_patterns": {
        "morning_peak": 9.5,
        "afternoon_dip": 14.5,
        "evening_recovery": 16.0
      }
    },
    "recommendations": [
      "Schedule demanding tasks during your 9-11 AM peak",
      "Consider shorter meetings (30 min max) after 2 PM",
      "Block 90-minute deep work sessions with 15-minute breaks"
    ]
  },
  "metadata": {
    "service": "reports",
    "timestamp": "2025-09-05T02:03:36.690Z",
    "processing_time_ms": 118
  }
}
```

## Service Inference (Smart Routing)

Instead of specifying the service explicitly, you can let the coordinator infer the service from your request content:

```http
POST https://tides-agent-101.mpazbot.workers.dev
Content-Type: application/json

{
  "api_key": "literally-any-string",
  "tides_id": "any-tide-id",
  "question": "How productive was I this week?"
}
```

This will automatically route to the **insights** service.

```http
POST https://tides-agent-101.mpazbot.workers.dev
Content-Type: application/json

{
  "api_key": "literally-any-string",
  "tides_id": "any-tide-id",
  "question": "What is the best time for me to do focused work?"
}
```

This will automatically route to the **optimize** service.

## Error Handling

### Mock Authentication
All API keys are accepted in this TDD environment. Any string can be used as api_key.

### Malformed JSON
```json
{
  "success": false,
  "error": "Invalid JSON in request body"
}
```

### Service Inference Issues
```json
{
  "success": false,
  "error": "Could not determine service from request content. Suggested: insights (20% confidence). Reason: Inferred from request structure and content. Add 'service' field to be explicit."
}
```

## Health Endpoints

### Basic Health Check
```http
GET https://tides-agent-101.mpazbot.workers.dev/health
```

**Response:**
```json
{
  "success": true,
  "data": {
    "healthy": true
  },
  "metadata": {
    "service": "coordinator",
    "timestamp": "2025-09-05T02:03:36.351Z",
    "processing_time_ms": 5
  }
}
```

### Service Status
```http
GET https://tides-agent-101.mpazbot.workers.dev/status
```

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": ["insights", "optimize", "questions", "preferences", "reports"],
    "version": "1.0.0",
    "agent_id": "coordinator-durable-object-id"
  },
  "metadata": {
    "service": "coordinator",
    "timestamp": "2025-09-05T02:03:36.351Z",
    "processing_time_ms": 8
  }
}
```

## Important Notes

1. **Mock Environment**: This is a TDD development environment with consistent mock responses
2. **ANY Credentials**: Both `api_key` and `tides_id` can be ANY string value - they are not validated
3. **Consistent Data**: Mock responses return the same structure every time for reliable testing
4. **Service Inference**: Smart routing can determine the correct service from request content
5. **Performance**: Response times are typically under 200ms
6. **CORS**: Cross-origin requests are fully supported

## Quick Test with cURL

Test the endpoint directly:

```bash
curl -X POST https://tides-agent-101.mpazbot.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "literally-anything",
    "tides_id": "whatever-you-want",
    "service": "insights",
    "timeframe": "30d"
  }'
```

This will return consistent mock data regardless of what values you use for `api_key` and `tides_id`.

This validates all endpoints and response structures automatically.