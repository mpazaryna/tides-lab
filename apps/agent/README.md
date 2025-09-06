# Tides Agent

Clean, microservices-based productivity agent built with Cloudflare Workers and Durable Objects.

## Architecture

Single **Coordinator** Durable Object that routes requests to internal micro-services:

- **InsightsService**: Productivity insights and analysis with real R2 tide data
- **OptimizeService**: Schedule optimization recommendations with personalized algorithms
- **QuestionsService**: Custom Q&A with AI-powered responses
- **PreferencesService**: User preferences management with KV storage
- **ReportsService**: Comprehensive productivity reports with analytics
- **ChatService**: AI-powered conversation and intent clarification

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
- `POST /preferences` - Get/update user preferences
- `POST /reports` - Generate productivity reports
- `POST /chat` - AI-powered conversation and clarification

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
- Unit tests for all 6 services (195 tests)
- Environment-specific storage integration tests
- Coordinator routing and service inference tests
- Authentication validation tests
- Real tide data validation tests
- Response format validation
- E2E tests with live endpoints

## Deployment

The agent supports multiple environments:

```bash
npm run deploy:101    # Production (tides-001-storage)
npm run deploy:102    # Staging (tides-002-storage) 
npm run deploy:103    # Development (tides-003-storage)
```

Each environment uses its own R2 bucket for isolated data storage.

## Current Implementation Status

### ✅ Phase 1: Foundation & Services
- [x] Project structure and configuration
- [x] Coordinator with request routing
- [x] All 6 micro-services with production data
- [x] Authentication and validation
- [x] Comprehensive unit tests (195 tests, 84.6% service coverage)
- [x] Multi-environment deployment (101, 102, 103)

### ✅ Phase 2: Real Service Implementation (Complete)
- [x] R2 storage integration for real tide data
- [x] Workers AI integration for chat service
- [x] Environment-specific storage with production data
- [x] Advanced question processing with AI
- [x] User preferences storage in KV
- [x] Rich report generation with analytics

### 📋 Phase 3: Production Ready (Future)
- [ ] Error handling and recovery
- [ ] Performance optimization  
- [ ] Integration tests
- [ ] Production deployment

## Example Usage

```bash
# Check agent status
curl https://tides-agent.your-domain.workers.dev/

# Generate insights
curl -X POST https://tides-agent.your-domain.workers.dev/insights \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_vm27ydanzrg_325FD3",
    "tides_id": "test-tide-123",
    "timeframe": "7d"
  }'

# Ask a question
curl -X POST https://tides-agent.your-domain.workers.dev/questions \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "tides_vm27ydanzrg_325FD3", 
    "tides_id": "test-tide-123",
    "question": "How can I improve my morning productivity?"
  }'
```