# Tides Agent

Clean, microservices-based productivity agent built with Cloudflare Workers and Durable Objects.

## Architecture

Single **Coordinator** Durable Object that routes requests to internal micro-services:

- **InsightsService**: Productivity insights and analysis
- **OptimizeService**: Schedule optimization recommendations  
- **QuestionsService**: Custom Q&A with AI-powered responses
- **PreferencesService**: User preferences management
- **ReportsService**: Comprehensive productivity reports

## API Endpoints

All endpoints require `api_key` and `tides_id` in the request body.

### GET Endpoints

- `GET /` - Agent status and health check
- `GET /health` - Simple health check

### POST Endpoints

- `POST /insights` - Generate productivity insights
- `POST /optimize` - Get schedule optimization recommendations
- `POST /questions` - Ask custom productivity questions
- `POST /preferences` - Get/update user preferences
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
- Unit tests for all services
- Coordinator routing tests  
- Authentication validation tests
- Mock data generation tests
- Response format validation

## Deployment

The agent is configured to deploy to environment 101 (clean test environment):

```bash
npm run deploy:101
```

## Current Implementation Status

### ✅ Phase 1: Foundation & Mock Responses
- [x] Project structure and configuration
- [x] Coordinator with request routing
- [x] All 5 micro-services with mock responses
- [x] Authentication and validation
- [x] Comprehensive unit tests (90%+ coverage)
- [x] Environment 101 deployment configuration

### 🚧 Phase 2: Real Service Implementation (Next)
- [ ] R2 storage integration for real tide data
- [ ] Workers AI integration for insights
- [ ] Real schedule optimization algorithms  
- [ ] Advanced question processing with AI
- [ ] Persistent user preferences storage
- [ ] Rich report generation with analytics

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

## Bump 

Test merge