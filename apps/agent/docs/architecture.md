# Tides Agent Architecture

## Overview

The Tides Agent implements Cloudflare's modern AI agent architecture pattern, emphasizing **autonomous reasoning**, **goal-directed behavior**, and **adaptive decision-making**.

## System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   User Request  │───▶│   Coordinator    │───▶│    Orchestrator     │
│  Natural Lang.  │    │  HTTP Gateway    │    │  AI Reasoning Hub   │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
                                                         │
                         ┌───────────────────────────────┴───────────────────────────────────┐
                         │                                                                   │
                         ▼                                                                   ▼
              ┌─────────────────────┐                                          ┌─────────────────────┐
              │   Service Inferrer  │                                          │   Service Ecosystem │
              │   AI-Powered        │                                          │                     │
              │   Intent Analysis   │                                          │  ▪ Insights         │
              └─────────────────────┘                                          │  ▪ Optimize         │
                         │                                                     │  ▪ Questions        │
                         ▼                                                     │  ▪ Preferences      │
              ┌─────────────────────┐                                          │  ▪ Reports          │
              │   Confidence        │                                          │  ▪ Chat             │
              │   Thresholding      │                                          └─────────────────────┘
              │   (>70% = Route)    │                                                    │
              └─────────────────────┘                                                    │
                         │                                                              │
                         └──────────────────────────────────────────────────────────────┘
                                                   │
                                                   ▼
                                        ┌─────────────────────┐
                                        │    Data Layer       │
                                        │                     │
                                        │  ▪ R2 Storage       │
                                        │  ▪ D1 Database      │
                                        │  ▪ Workers KV       │
                                        └─────────────────────┘
```

## Core Components

### 1. Coordinator (HTTP Gateway)
**Location**: `src/coordinator.ts`  
**Purpose**: Lightweight HTTP entry point with authentication

**Responsibilities**:
- HTTP request handling and CORS
- API key validation via D1 database
- Request parsing and basic validation
- Response formatting and metadata injection
- Delegation to orchestrator for business logic

**Key Features**:
- Zero business logic - pure HTTP layer
- Comprehensive error handling
- Development endpoints (status, health, ai-test)
- R2 testing capabilities

### 2. Orchestrator (AI Reasoning Hub)
**Location**: `src/services/orchestrator.ts`  
**Purpose**: Intelligent request routing and service coordination

**Responsibilities**:
- AI-powered intent analysis
- Service routing decisions
- Chat/conversation handling
- Legacy endpoint support
- Service execution coordination

**Key Features**:
- **Explicit routing**: Direct service parameter takes precedence
- **AI inference routing**: Uses ServiceInferrer for intent analysis  
- **Legacy support**: Handles direct endpoint paths
- **Chat fallback**: Defaults to conversational AI for unclear intent

### 3. Service Inferrer (AI Intent Analysis)
**Location**: `src/service-inferrer.ts`  
**Purpose**: Cloudflare Workers AI-powered intent recognition

**AI Model**: `@cf/meta/llama-3.1-8b-instruct`  
**Confidence Threshold**: 70% for automatic routing

**Analysis Process**:
```typescript
const analysisPrompt = `
Analyze this request and determine which productivity service it needs:
- insights: data analysis, trends, productivity scores  
- optimize: schedule optimization, time blocking
- questions: Q&A, advice, "how can I"
- preferences: settings, configuration
- reports: summaries, exports, data reports
- chat: unclear intent, conversational

Request: "${message}"
Additional context: ${JSON.stringify(additionalFields)}

Respond with JSON: {"service": "service_name", "confidence": 85}
`;
```

**Routing Logic**:
- Confidence ≥ 70%: Route to inferred service
- Confidence < 70%: Route to chat service for clarification

### 4. Service Ecosystem
**Location**: `src/services/`

#### Insights Service (`insights.ts`)
- **Purpose**: Productivity analytics and trend analysis
- **Capabilities**: Flow session analysis, energy patterns, productivity scoring
- **Data Sources**: R2 tide data, real-time calculations

#### Optimize Service (`optimize.ts`)
- **Purpose**: Schedule optimization and time blocking
- **Capabilities**: Energy-aware scheduling, focus time recommendations
- **Algorithm**: Sequential time blocking with energy alignment

#### Questions Service (`questions.ts`)
- **Purpose**: AI-powered productivity Q&A
- **Capabilities**: Contextual advice, personalized recommendations
- **AI Integration**: Cloudflare Workers AI with tide context

#### Preferences Service (`preferences.ts`)
- **Purpose**: User settings and configuration management
- **Storage**: Cloudflare KV with fallback defaults
- **Capabilities**: CRUD operations for user preferences

#### Reports Service (`reports.ts`)
- **Purpose**: Comprehensive productivity reporting
- **Capabilities**: Summary, detailed, and analytics reports
- **Export Formats**: JSON, CSV (PDF placeholder)

#### Chat Service (via Orchestrator)
- **Purpose**: Conversational AI interface
- **Capabilities**: Intent clarification, contextual responses
- **AI Model**: `@cf/meta/llama-3.1-8b-instruct`
- **Context**: Real tide data integration for personalized responses

## Data Architecture

### Cloudflare R2 Storage
**Purpose**: Primary productivity data storage

**Structure**:
```
users/
├── {userId}/
│   └── tides/
│       ├── {tideId}.json        # Full tide data
│       ├── daily-tide-default/  # Default tide
│       └── context-tides/       # Monthly, weekly tides
```

**Tide Data Schema**:
```typescript
interface TideData {
  id: string;
  name: string;
  user_id: string;
  flow_sessions: FlowSession[];
  energy_updates: EnergyUpdate[];
  task_links: TaskLink[];
  created_at: string;
  updated_at: string;
}
```

### Cloudflare D1 Database
**Purpose**: Authentication and API key management

**Schema**:
```sql
CREATE TABLE api_keys (
  id INTEGER PRIMARY KEY,
  user_id TEXT NOT NULL,
  key_hash TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used DATETIME
);
```

### Cloudflare KV
**Purpose**: User preferences and temporary data

**Keys**:
- `user:{userId}:preferences` - User configuration
- `user:{userId}:temp` - Temporary session data

## AI Integration

### Cloudflare Workers AI Model
**Model**: `@cf/meta/llama-3.1-8b-instruct`  
**Usage**: Intent analysis and conversational responses

### Service Inference Process
1. **Request Analysis**: Extract message and context fields
2. **AI Prompt**: Structured prompt with service descriptions
3. **Confidence Scoring**: AI returns service + confidence percentage
4. **Routing Decision**: Route if confidence ≥ 70%, else chat fallback

### Chat Context Integration
When generating conversational responses, the agent includes:
- Recent flow sessions (duration, intensity)
- Latest energy levels and patterns  
- Linked tasks and their types
- Productivity trends and insights

This creates **context-aware responses** that reference the user's actual productivity data.

## Performance Characteristics

### Response Times
- **Coordinator**: 50-100ms (HTTP overhead only)
- **AI Inference**: 200-400ms (depends on Cloudflare Workers AI)
- **Service Execution**: 100-300ms (varies by complexity)
- **Data Fetching**: 50-150ms (R2 access)

### Scalability
- **Serverless**: Auto-scales with Cloudflare Workers
- **Global Edge**: Deployed to Cloudflare's global network
- **Stateless Services**: Horizontal scaling capability
- **Durable Objects**: Stateful coordination when needed

### Reliability
- **Graceful Degradation**: Chat fallback when services unavailable
- **Error Recovery**: Comprehensive error handling at each layer
- **Health Monitoring**: Status endpoints for system health
- **Retry Logic**: Built-in retry for transient failures

## Security Architecture

### Authentication Flow
1. **API Key Validation**: SHA-256 hash lookup in D1 database
2. **User Resolution**: Map API key to user_id
3. **Tide Access Control**: Verify user owns requested tide
4. **Service Authorization**: Pass validated user_id to services

### Data Security
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: User-scoped data access only  
- **Key Rotation**: Support for API key rotation
- **Audit Trail**: Request logging and monitoring

## Development Architecture

### Testing Strategy
- **Unit Tests**: 212 tests with 66.66% coverage
- **Integration Tests**: End-to-end service testing
- **AI Testing**: Service inference validation
- **Performance Testing**: Response time monitoring

### Deployment Environments
- **env.101**: Production (iOS deployment)
- **env.102**: Staging (primary development)
- **env.103**: Development (legacy)

### Monitoring & Observability
- **Streamlit Interface**: Visual testing and debugging
- **Health Endpoints**: System status monitoring
- **Performance Metrics**: Response time tracking
- **Error Analytics**: Comprehensive error reporting

## Agent Philosophy Implementation

The architecture embodies Cloudflare's AI agent principles:

1. **Autonomy**: Service inferrer makes routing decisions independently
2. **Goal-Directed Reasoning**: Each service optimizes for specific productivity outcomes
3. **Adaptive Decision-Making**: Chat service provides fallback when intent is unclear

This creates an intelligent system that **understands user intent** and **autonomously determines the best approach** to help achieve productivity goals, rather than requiring explicit service specification.

---

*Architecture follows Cloudflare's modern serverless patterns with AI-first design principles*