# Tides Agent

AI-powered productivity intelligence layer built with Cloudflare Workers and advanced service orchestration.

## Architecture

**Coordinator** that intelligently routes requests to specialized analytics services using AI inference:

- **InsightsService**: Productivity insights and analysis with real R2 tide data
- **OptimizeService**: Schedule optimization recommendations with personalized algorithms  
- **QuestionsService**: Custom Q&A with AI-powered responses
- **ReportsService**: Comprehensive productivity reports with analytics

The agent functions as an **intelligence layer** that analyzes existing productivity data rather than executing external tools. It uses Llama 3.1-8b-instruct for service inference and natural language understanding.

## API Endpoints

All endpoints require `api_key` and `tides_id` in the request body.

### GET Endpoints

- `GET /` - Agent status and health check
- `GET /health` - Simple health check

### POST Endpoints

- `POST /coordinator` - Smart routing with service inference (recommended)
- `POST /insights` - Generate productivity insights
- `POST /optimize` - Get schedule optimization recommendations
- `POST /questions` - Ask custom productivity questions
- `POST /reports` - Generate productivity reports

## Request Format

```json
{
  "api_key": "your-api-key",
  "tides_id": "your-tide-id",
  // ... additional service-specific fields
}
```

## Response Format

```json
{
  "success": true,
  "data": { /* service response data */ },
  "metadata": {
    "service": "service-name",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "processing_time_ms": 123
  }
}
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Type checking
npm run typecheck

# Deploy to environment 101
npm run deploy:101
```

## Testing

Run comprehensive test suite with coverage reporting:

```bash
npm run test:coverage
```

Tests include:
- Unit tests for all 4 services (insights, optimize, questions, reports)
- Environment-specific storage integration tests
- Coordinator routing and service inference tests
- Authentication validation tests  
- Real tide data validation tests
- Response format validation
- E2E tests with live endpoints

## Deployment

The agent supports multiple environments:

```bash
npm run deploy:101    # Production (tides-agent-101.mpazbot.workers.dev)
npm run deploy:102    # Staging (tides-agent-102.mpazbot.workers.dev) 
npm run deploy:103    # Development (tides-agent-103.mpazbot.workers.dev)
```

Each environment uses its own R2 bucket for isolated data storage.

## Current Implementation Status

### ✅ Phase 1: Foundation & Services
- [x] Project structure and configuration
- [x] Coordinator with request routing
- [x] Core 4 micro-services with production data (insights, optimize, questions, reports)
- [x] Authentication and validation
- [x] Multi-environment deployment (101, 102, 103)

### ✅ Phase 2: Real Service Implementation (Complete)
- [x] R2 storage integration for real tide data
- [x] Workers AI integration for questions service
- [x] Environment-specific storage with production data
- [x] Advanced question processing with AI
- [x] Rich report generation with analytics

### 📋 Phase 3: Data Integration (Future)
- [ ] User preferences via MCP tide tools integration
- [ ] Real-time data synchronization with main MCP server
- [ ] Enhanced analytics with cross-platform data
- [ ] Error handling and recovery
- [ ] Performance optimization

### 📋 Phase 4: MCP Tools Integration (Future)
- [ ] Integration with 8 core MCP tide tools
- [ ] Bidirectional data flow (read analytics, write actions)
- [ ] Tool orchestration for complex workflows
- [ ] Cross-client action coordination

## Example Usage

```bash
# Check agent status
curl https://tides-agent-102.mpazbot.workers.dev/

# Natural language request (recommended)
curl -X POST https://tides-agent-102.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_vm27ydanzrg_325FD3",
    "tides_id": "test-tide-123", 
    "message": "Show me my productivity insights for the past week"
  }'

# Direct service endpoint
curl -X POST https://tides-agent-102.mpazbot.workers.dev/insights \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_vm27ydanzrg_325FD3",
    "tides_id": "test-tide-123",
    "timeframe": "7d"
  }'
```

## Intelligence Layer Architecture

The Tides Agent operates as a **Cloudflare AI agent** following modern agent patterns:

### Current State: Analytics Intelligence
- **Data Analysis**: Read-only access to R2 productivity data
- **AI-Powered Routing**: Llama 3.1-8b-instruct for service inference  
- **Natural Language Processing**: Conversational interface for insights
- **Separation of Concerns**: Intelligence layer separate from MCP tool execution

### Future Vision: Multi-Agent Coordinator  
The coordinator architecture enables expansion to a full agent ecosystem:

1. **Calendar Agent**: Schedule analysis and optimization
2. **Task Agent**: Cross-platform task management intelligence
3. **Health Agent**: Energy correlation with biometric data
4. **Execution Agent**: MCP tool orchestration for actions

### Documentation
- **[API Reference](./docs/api.md)**: Detailed service endpoints and examples
- **[Architecture Guide](./docs/architecture.md)**: Technical implementation details  
- **[Integration Patterns](./docs/integration.md)**: Frontend integration examples