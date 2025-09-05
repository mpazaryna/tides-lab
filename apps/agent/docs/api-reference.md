# Tides Agent API Reference

## Base URL
```
https://tides-agent-101.mpazbot.workers.dev
```

## Authentication

All POST endpoints require authentication via request body:

```json
{
  "api_key": "tides_{userId}_{randomId}",
  "tides_id": "your-tide-id"
}
```

## Endpoints

### Health & Status

#### GET /
Get agent status and available services.

**Response:**
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": ["insights", "optimize", "questions", "preferences", "reports"],
    "version": "1.0.0",
    "agent_id": "coordinator-id"
  },
  "metadata": {
    "service": "coordinator",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "processing_time_ms": 0
  }
}
```

#### GET /health
Simple health check.

**Response:**
```json
{
  "success": true,
  "data": { "healthy": true },
  "metadata": { /* ... */ }
}
```

### Productivity Services

#### POST /insights
Generate productivity insights and analysis.

**Request:**
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "tide-123",
  "timeframe": "7d",
  "focus_areas": ["coding", "meetings"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "productivity_score": 87,
    "trends": {
      "daily_average": 82,
      "weekly_pattern": [75, 80, 85, 78, 82, 68, 72],
      "improvement_areas": ["Morning focus sessions", "Afternoon energy management"]
    },
    "recommendations": [
      "Consider scheduling deep work during your peak hours (9-11 AM)",
      "Take more frequent breaks to maintain energy levels"
    ]
  },
  "metadata": { /* ... */ }
}
```

#### POST /optimize
Get schedule optimization recommendations.

**Request:**
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "tide-123",
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
          "end": "11:00", 
          "activity": "Deep Work - High Priority Tasks",
          "priority": 1
        }
      ]
    },
    "efficiency_gains": {
      "estimated_time_saved": 45,
      "focus_improvement": 25
    }
  },
  "metadata": { /* ... */ }
}
```

#### POST /questions
Ask custom productivity questions with AI analysis.

**Request:**
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "tide-123",
  "question": "How can I improve my morning productivity?",
  "context": "remote work"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Morning productivity can be significantly improved by establishing a consistent routine...",
    "confidence": 92,
    "related_insights": ["Peak performance hours: 9-11 AM", "Morning routine consistency boosts focus by 35%"],
    "suggested_actions": ["Create a morning routine checklist", "Schedule deep work for 9-11 AM"]
  },
  "metadata": { /* ... */ }
}
```

#### POST /preferences
Get or update user preferences.

**Get Preferences (no preferences field):**
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "tide-123"
}
```

**Update Preferences (with preferences field):**
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "tide-123",
  "preferences": {
    "work_hours": { "start": "08:30", "end": "16:30" },
    "break_duration": 20,
    "focus_time_blocks": 120,
    "notification_preferences": {
      "insights": true,
      "optimization": true,
      "reminders": false
    }
  }
}
```

**Response (both cases):**
```json
{
  "success": true,
  "data": {
    "work_hours": { "start": "08:30", "end": "16:30" },
    "break_duration": 20,
    "focus_time_blocks": 120,
    "notification_preferences": {
      "insights": true,
      "optimization": true, 
      "reminders": false
    }
  },
  "metadata": { /* ... */ }
}
```

#### POST /reports
Generate comprehensive productivity reports.

**Request:**
```json
{
  "api_key": "tides_vm27ydanzrg_325FD3",
  "tides_id": "tide-123",
  "report_type": "detailed",
  "period": "30d"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report_type": "detailed",
    "period": "30d",
    "summary": {
      "total_productive_hours": 145,
      "average_daily_score": 83,
      "completed_tasks": 167,
      "focus_sessions": 78
    },
    "detailed_metrics": {
      "productivity_trends": {
        "weekly_averages": [78, 82, 85, 79, 88, 76, 81]
      },
      "time_distribution": {
        "deep_work": 45,
        "meetings": 25,
        "administrative": 15,
        "breaks": 15
      }
    },
    "recommendations": [
      "Schedule your most challenging tasks during 9-11 AM when productivity peaks"
    ]
  },
  "metadata": { /* ... */ }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "metadata": {
    "service": "service-name",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "processing_time_ms": 0
  }
}
```

### Common Errors

| Status | Error | Description |
|--------|-------|-------------|
| 400 | "Request body is required" | Missing request body |
| 400 | "Invalid JSON in request body" | Malformed JSON |
| 401 | "api_key is required in request body" | Missing API key |
| 401 | "tides_id is required in request body" | Missing tide ID |
| 401 | "Invalid API key" | API key not found or invalid |
| 404 | "POST /unknown not found" | Unknown endpoint |
| 405 | "Method DELETE not allowed" | Unsupported HTTP method |
| 500 | "Internal server error" | Server error |

## Rate Limits

Currently no rate limiting is implemented, but standard Cloudflare Workers limits apply:
- 100,000 requests per day (free tier)
- 1000 requests per minute burst

## CORS Support

All endpoints include CORS headers:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`