# Tides AI Agent

A **Cloudflare Workers AI Agent** for productivity intelligence and workflow optimization.

## Agent Philosophy

The Tides Agent is designed as the **Intelligence Layer** for the Tides productivity ecosystem, following Cloudflare's AI agent architecture:

- **Intelligence, Not Execution**: Analyzes existing productivity data rather than executing MCP tools
- **Autonomous Reasoning**: Understands user intent and provides intelligent insights  
- **Goal-Directed Analysis**: Works toward improving user productivity through data-driven insights
- **Adaptive Decision-Making**: Routes to appropriate analytics capabilities based on context
- **Real-Time Intelligence**: Analyzes actual workflow data stored in R2 for personalized coaching

**Architectural Role**: The agent operates as a **separate intelligence service** alongside the Tides MCP Server, not as an MCP tool executor. This follows Cloudflare's pattern of independent services rather than remote MCP calls.

## Architecture

**Tides Ecosystem Overview:**
```
┌─────────────────────────┐    ┌─────────────────────────┐
│     Tides MCP Server    │    │     Tides AI Agent      │
│   (Tool Execution)      │    │   (Intelligence Layer)  │
│                         │    │                         │
│  • tide_create          │    │  • Productivity Analysis│
│  • tide_flow            │    │  • Pattern Recognition  │
│  • tide_add_energy      │    │  • AI-Powered Insights  │
│  • tide_link_task       │    │  • Conversational UI    │
│                         │    │                         │
│  ↓ Writes Data          │    │  ↑ Reads Data           │
│                         │    │                         │
│     Cloudflare R2       │────│     Cloudflare R2       │
│   (Productivity Data)   │    │   (Same Data Source)    │
└─────────────────────────┘    └─────────────────────────┘
```

**Agent-Specific Architecture:**
```
User Query → AI Reasoning → Analytics Service → Intelligence Output
     ↓             ↓              ↓                    ↓
  Natural      Cloudflare     Data Analysis        Insights &
  Language      Workers AI    (Not MCP Tools)      Recommendations
```

### Core Components

- **Coordinator**: Lightweight HTTP entry point with authentication
- **Orchestrator**: AI-powered intent analysis and analytics routing
- **Analytics Ecosystem**: Specialized services for productivity intelligence
- **Data Intelligence**: R2-based analysis of existing workflow patterns

**Key Distinction**: This agent **analyzes productivity data** created by MCP tools, but does not execute MCP tools itself.

## Agent Capabilities

### 🧠 Autonomous Intent Recognition

The agent automatically understands what you want to accomplish:

```json
{
  "message": "I've been struggling with focus lately",
  "api_key": "your-api-key",
  "tides_id": "daily-tide-default"
}
```

**Agent Response**: Analyzes your recent flow sessions, energy patterns, and provides personalized coaching based on your actual data.

### 📊 Intelligent Analytics

Ask questions naturally - the agent determines the right analysis approach:

```json
{
  "message": "Show me my productivity patterns over the last two weeks",
  "api_key": "your-api-key", 
  "tides_id": "your-tide-id"
}
```

**Agent Response**: Automatically routes to insights service, analyzes 14 days of data, and presents meaningful trends.

### ⚡ Adaptive Optimization

The agent proactively suggests workflow improvements:

```json
{
  "message": "Help me optimize my schedule for tomorrow",
  "api_key": "your-api-key",
  "tides_id": "your-tide-id" 
}
```

**Agent Response**: Analyzes your energy patterns, task types, and preferences to generate a personalized schedule.

## API Reference

### Base URL
```
https://tides-agent-{env}.mpazbot.workers.dev
```

**Environments:**
- `101` - Production (iOS deployment)
- `102` - Staging (primary development)
- `103` - Development (legacy)

### Single Endpoint Design

#### POST `/coordinator`

**The only endpoint you need** - handles all agent interactions through intelligent routing.

**Request Format:**
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "your-tide-id",
  "message": "Natural language request",
  "timestamp": "2025-01-09T10:30:00Z"
}
```

**Response Format:**
```json
{
  "success": true,
  "data": {
    // Agent response - varies by capability used
  },
  "metadata": {
    "service": "insights", // Which capability was invoked
    "inference": {
      "confidence": 92,
      "reasoning": "AI-powered semantic analysis"
    },
    "processing_time_ms": 245,
    "timestamp": "2025-01-09T10:30:15Z"
  }
}
```

## Agent Service Ecosystem

The agent intelligently routes requests to specialized services based on intent analysis. Here's what each service provides:

### 📊 **Insights Service**
**Purpose**: Real-time productivity analytics from your actual workflow data

**What it analyzes**:
- Flow session duration, intensity, and patterns  
- Energy level trends over time
- Task completion rates and types
- Weekly productivity patterns

**Response format**:
```json
{
  "productivity_score": 82,           // 0-100 calculated from real data
  "trends": {
    "daily_average": 74,              // Average productivity score  
    "weekly_pattern": [90,125,105,135,95,80,65], // Minutes per day
    "improvement_areas": [
      "morning focus sessions",        // Based on actual patterns
      "afternoon energy management"
    ]
  },
  "recommendations": [
    "Schedule deep work between 9-11 AM when you're most focused",
    "Consider 25-minute focus blocks during low-energy periods",
    "Your Tuesday productivity is 40% higher than Monday - plan important tasks then"
  ]
}
```

**Example queries**:
- *"How productive was I this week?"*
- *"Show me my productivity trends"*  
- *"What are my peak focus hours?"*

### ⚡ **Optimize Service**
**Purpose**: AI-generated schedule optimization based on your energy patterns

**What it optimizes**:
- Time blocking aligned with your energy levels
- Focus session scheduling during peak hours
- Break timing based on your patterns
- Task type matching to optimal times

**Response format**:
```json
{
  "suggested_schedule": {
    "time_blocks": [
      {
        "start": "09:00",
        "end": "10:30", 
        "activity": "Deep work - complex tasks",
        "priority": 5,
        "reasoning": "Your peak focus time based on session data"
      },
      {
        "start": "10:30",
        "end": "10:45",
        "activity": "Break",
        "priority": 3,
        "reasoning": "Optimal break timing for sustained focus"
      }
    ]
  },
  "efficiency_gains": {
    "estimated_time_saved": 45,        // Minutes per day
    "focus_improvement": "23%"         // Based on your patterns
  },
  "recommendations": [
    "Block 90-minute deep work sessions during your peak hours (9-11 AM)",
    "Schedule administrative tasks during low-energy periods (2-3 PM)",
    "Take 15-minute breaks every 90 minutes for optimal flow"
  ]
}
```

**Example queries**:
- *"Optimize my schedule for tomorrow"*
- *"How should I structure my work day?"*
- *"Create a focus schedule based on my energy"*

### 🤔 **Questions Service** 
**Purpose**: AI-powered productivity coaching with context from your data

**What it provides**:
- Personalized advice based on your actual patterns
- Specific recommendations using your tide data
- Contextual coaching for productivity challenges
- Goal-oriented guidance

**Response format**:
```json
{
  "answer": "Based on your data, you're most productive between 9-11 AM with 90-minute sessions. Your Tuesday sessions average 23% longer than other days. I recommend scheduling your most challenging work during these peak windows and using Tuesday for your weekly planning session.",
  "supporting_data": {
    "peak_hours": ["09:00", "10:30"],
    "best_day": "Tuesday", 
    "avg_session_length": 67,          // Minutes
    "success_pattern": "morning_focused"
  },
  "action_items": [
    "Block 9-11 AM for deep work",
    "Use Tuesday for complex projects",
    "Avoid scheduling meetings during peak focus time"
  ]
}
```

**Example queries**:
- *"How can I improve my morning productivity?"*
- *"Why do I lose focus in the afternoon?"*
- *"What's the best time for me to do creative work?"*

### ⚙️ **Preferences Service**
**Purpose**: Manage user settings and productivity preferences

**What it handles**:
- Work schedule preferences (start/end times)
- Focus session length preferences  
- Notification settings
- Productivity goal configurations

**Response format**:
```json
{
  "work_hours": {
    "start": "09:00",
    "end": "17:00",
    "timezone": "America/New_York"
  },
  "focus_preferences": {
    "preferred_session_length": 90,    // Minutes
    "break_frequency": 15,             // Minutes
    "deep_work_hours": ["09:00", "11:00"]
  },
  "goals": {
    "daily_focus_target": 240,         // Minutes
    "weekly_sessions_target": 25
  }
}
```

**Example queries**:
- *"What are my current preferences?"*
- *"Update my work hours to 10 AM - 6 PM"*
- *"Set my focus session goal to 4 hours daily"*

### 📋 **Reports Service**
**Purpose**: Comprehensive productivity reporting and data export

**Report types**:
- **Summary**: High-level overview with key metrics
- **Detailed**: In-depth analysis with trends and patterns
- **Analytics**: Charts and visualizations for deeper insights

**Response format**:
```json
{
  "report_type": "summary",
  "period": "30d",
  "summary": {
    "total_productive_hours": 142.5,
    "average_daily_score": 78,
    "completed_tasks": 47,
    "focus_sessions": 89,
    "peak_productivity_day": "Tuesday",
    "peak_productivity_hour": "10:00"
  },
  "detailed_metrics": {
    "productivity_trends": {
      "weekly_averages": [85, 92, 78, 88, 76, 72, 65], // Mon-Sun
      "monthly_comparison": {
        "current_month": 78,
        "previous_month": 71,
        "improvement": "10%"
      }
    },
    "time_distribution": {
      "deep_work": 45,      // Percentage
      "meetings": 25,
      "administrative": 15,
      "breaks": 15
    }
  },
  "recommendations": [
    "Your productivity increased 10% this month",
    "Tuesday remains your most productive day - protect this time",
    "Consider scheduling fewer meetings on high-energy days"
  ]
}
```

**Example queries**:
- *"Generate a productivity report for this month"*
- *"Show me a detailed analysis of my work patterns"*
- *"Export my productivity data"*

### 💬 **Chat Service**
**Purpose**: Conversational AI that understands your productivity context

**What it provides**:
- Natural conversation about your productivity patterns
- Intent clarification when requests are ambiguous
- Contextual coaching using your actual data
- Follow-up questions and suggestions

**Response format**:
```json
{
  "message": "I can see you've completed 3 focus sessions totaling 4.5 hours today, which is 23% above your average. Your energy level was highest during the 10 AM session. How are you feeling about your progress?",
  "context_used": {
    "sessions_today": 3,
    "total_time": 270,     // Minutes
    "vs_average": "+23%",
    "peak_session": "10:00 AM"
  },
  "suggestions": [
    "Would you like me to analyze your weekly patterns?",
    "Should I help optimize tomorrow's schedule?",
    "Want to set a specific goal for the rest of the week?"
  ],
  "conversation_id": "conv_abc123"
}
```

**Example queries**:
- *"How am I doing today?"*
- *"I'm feeling unfocused lately"*
- *"Help me understand my productivity patterns"*

## Authentication

Uses the existing Tides ecosystem authentication:

```bash
API_KEY=tides_{userId}_{randomId}
```

Keys are validated against Cloudflare D1 database with SHA-256 hashing.

## Usage Examples

### Natural Language Queries
```bash
curl -X POST https://tides-agent-102.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need to improve my morning productivity",
    "api_key": "your-api-key",
    "tides_id": "daily-tide-default"
  }'
```

### Goal-Directed Requests
```bash
curl -X POST https://tides-agent-102.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Create a focus schedule for tomorrow based on my energy patterns",
    "api_key": "your-api-key", 
    "tides_id": "your-tide-id"
  }'
```

### Analytics Requests  
```bash
curl -X POST https://tides-agent-102.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What are my peak productivity hours this month?",
    "api_key": "your-api-key",
    "tides_id": "your-tide-id"
  }'
```

## Agent Intelligence

### AI Model Integration
- **Cloudflare Workers AI**: `@cf/meta/llama-3.1-8b-instruct`
- **Semantic Analysis**: Intent recognition and capability routing
- **Contextual Understanding**: Incorporates user's actual workflow data
- **Adaptive Responses**: Personalized coaching based on patterns

### Service Routing Intelligence

The agent analyzes your request and determines the best service with high confidence:

| Intent Pattern | Example Queries | Routed To | Confidence |
|----------------|----------------|-----------|------------|
| **Productivity Analysis** | "How productive was I?", "Show trends", "My focus patterns" | **Insights Service** | 90-95% |
| **Schedule Optimization** | "Optimize my day", "Plan my schedule", "Time blocking" | **Optimize Service** | 85-90% |
| **Productivity Questions** | "How can I improve?", "Why do I lose focus?", "Best time for deep work?" | **Questions Service** | 80-95% |
| **Settings & Config** | "My preferences", "Update work hours", "Set goals" | **Preferences Service** | 90% |
| **Data Export** | "Generate report", "Export data", "Monthly summary" | **Reports Service** | 90% |
| **Conversational** | "I'm struggling today", "Help me focus", "How am I doing?" | **Chat Service** | Default |

**Routing Logic**:
1. **Explicit service parameter**: Routes directly (100% confidence)
2. **High-confidence inference** (≥70%): Routes to specific service  
3. **Low confidence** (<70%): Routes to chat for clarification
4. **Context awareness**: Uses previous conversation and tide data

### Data Intelligence

- **Real-time Analysis**: Reads productivity data from Cloudflare R2 (written by MCP tools)
- **Pattern Recognition**: Identifies trends from flow sessions, energy updates, and task links
- **Predictive Insights**: Forecasts optimal work patterns based on historical data
- **Personalization**: Adapts recommendations to individual workflow style
- **Read-Only Operations**: Does not modify or create tide data - purely analytical

## Error Handling

```json
{
  "success": false,
  "error": "Unable to analyze productivity patterns - insufficient data",
  "metadata": {
    "service": "insights",
    "suggestion": "Try logging some flow sessions first",
    "timestamp": "2025-01-09T10:30:15Z"
  }
}
```

## Development & Testing

### Streamlit Testing Interface
```bash
cd apps/demo/st_client
streamlit run app.py
```

- **Agent Services**: Test individual capabilities
- **Agent Inference**: Test AI routing and conversation
- **MCP Tools**: Get real tide data for testing
- **Monitoring**: Performance and health metrics

### Agent Status
```bash
curl https://tides-agent-102.mpazbot.workers.dev/status
```

Returns agent health, available capabilities, and performance metrics.

## Production Considerations

### Performance
- **Response Times**: 200-500ms typical
- **AI Inference**: 250ms average for intent recognition
- **Data Analysis**: 100-300ms for productivity insights
- **Conversation**: 300-450ms for contextual responses

### Scalability
- **Cloudflare Workers**: Serverless auto-scaling
- **Durable Objects**: Stateful coordination
- **R2 Storage**: Distributed data access
- **Global Edge**: Low-latency worldwide

### Reliability
- **Graceful Degradation**: Falls back to conversational AI when services unavailable
- **Authentication**: Secure API key validation
- **Data Integrity**: Real-time tide data integration
- **Error Recovery**: Intelligent error handling with user guidance

---

## Tides Ecosystem Integration

### How the Agent Fits in Your Workflow

The Tides Agent is designed as a **companion intelligence service** to the Tides MCP ecosystem:

**1. Data Creation (via MCP Tools)**
```bash
# Users interact with MCP Server to create productivity data
tide_create --name "Sprint Planning" --type "project"
tide_flow --action "start" --intensity "high"  
tide_add_energy --level "medium" --note "Post-lunch dip"
tide_link_task --type "development" --priority 5
```

**2. Intelligence Analysis (via AI Agent)**
```bash
# Users ask the Agent to analyze the data created above
curl -X POST /coordinator -d '{
  "message": "How did my sprint planning session go?",
  "api_key": "...",
  "tides_id": "..."
}'

# Agent response includes insights from the MCP-created data:
# "Your 90-minute sprint session had high intensity with a mid-session 
#  energy dip. Consider scheduling planning sessions in the morning when 
#  your energy is consistently higher."
```

### Separation of Concerns

| Responsibility | Tides MCP Server | Tides AI Agent |
|----------------|------------------|----------------|
| **Data Creation** | ✅ Creates flow sessions | ❌ Read-only access |
| **Data Modification** | ✅ Updates energy levels | ❌ No write operations |
| **Tool Execution** | ✅ Executes tide tools | ❌ No tool execution |
| **Data Analysis** | ❌ Basic data storage | ✅ Advanced analytics |
| **AI Insights** | ❌ No AI capabilities | ✅ Conversational intelligence |
| **Pattern Recognition** | ❌ No pattern analysis | ✅ Trend identification |

### Future Integration Path

Following Cloudflare's MCP architecture patterns, future integration could include:

1. **Agent-to-MCP Communication**: The agent could call MCP Server tools when users request actions like "Start a focus session"
2. **Bidirectional Intelligence**: MCP tools could trigger agent analysis automatically  
3. **Unified Interface**: Single conversational interface for both tool execution and intelligence

However, the current **independent services approach** aligns with Cloudflare's recommended patterns for production systems.

## Agent Philosophy in Practice

The Tides Agent represents a **specialized intelligence layer** that transforms raw productivity data into actionable insights. Instead of replacing MCP tools, it **enhances the ecosystem** by providing conversational access to sophisticated analytics.

This follows Cloudflare's vision of focused, goal-oriented AI services that work together rather than monolithic systems that try to do everything.

---

*Built with Cloudflare Workers AI, Durable Objects, and R2 Storage*  
*Production Status: ✅ Fully Operational*  
*Last Updated: January 2025*