# Tides Agent Documentation

**Comprehensive documentation for the Tides Agent productivity microservices platform.**

## 📚 Documentation Index

### Core Documentation
- **[API](api.md)** - API endpoint documentation
- **[iOS](ios.md)** - iOS integration guide  
- **[Chat](chat.md)** - Chat service implementation


## 🏗️ System Architecture

### Core Services (All Production Ready)
1. **Insights Service** - Productivity analysis using authentic R2 tide data (no mock responses)
2. **Optimize Service** - Schedule optimization with sequential time blocking (fixed overlapping schedules) 
3. **Questions Service** - AI-powered productivity Q&A with contextual responses
4. **Preferences Service** - User settings and preferences management
5. **Reports Service** - Comprehensive productivity reporting with real data calculations
6. **Chat Service** - Tide-aware conversational AI with contextual responses (85% confidence threshold)

### Technical Stack
- **Platform**: Cloudflare Workers with Durable Objects
- **Storage**: R2 bucket `tides-006-storage` for tide data, KV for user preferences and auth
- **AI Integration**: Cloudflare Workers AI for chat responses
- **Authentication**: SHA-256 hashed API keys with KV validation
- **Architecture**: Microservices coordination with intelligent routing

## 🚀 Quick Start for iOS Team

### Production Environments
- **Tides Agent**: `${AGENT_BASE_URL}`
- **MCP Server**: `${MCP_SERVER_URL}/mcp`

**Environment Variables:**
```bash
AGENT_BASE_URL=https://tides-agent-102.mpazbot.workers.dev
MCP_SERVER_URL=https://tides-006.mpazbot.workers.dev
```

### Basic Request
```json
{
  "api_key": "tides_userId_randomId",
  "tides_id": "daily-tide-default",
  "message": "How productive was I today?"
}
```

### Response Format
```json
{
  "success": true,
  "data": { /* service response */ },
  "metadata": {
    "service": "insights",
    "timestamp": "2025-09-05T15:30:00.000Z",
    "processing_time_ms": 123
  }
}
```

## 📊 Current Status

### Test Coverage (Current)
- **Services**: 84.63% statement coverage
- **Overall**: 61.76% statement coverage  
- **Total Tests**: 195 passing tests (unit tests)
- **Service Breakdown**:
  - OptimizeService: 100%
  - PreferencesService: 94.73%
  - InsightsService: 90.64%
  - ReportsService: 77.18%
  - QuestionsService: 74.75%
  - ChatService: 64.91%

### Performance Metrics
- **Service Responses**: 50-200ms
- **AI Chat Responses**: 561ms average
- **Uptime**: Production ready
- **Environment**: Fully operational

## 🗄️ Storage Architecture

Simple, unified storage approach for iOS team integration:

### Data Storage
- **R2 Bucket**: `tides-006-storage` - All tide data and user content
- **KV Storage**: User preferences and API key authentication
- **Access Pattern**: Direct bucket access with path-based organization

### Usage Examples

```typescript
// Get tide data from R2 storage
const data = await storageService.getTideData(userId, tideId);

// Save tide data to R2 storage  
const success = await storageService.saveTideData(userId, tideId, tideData);

// List user tides
const tides = await storageService.listUserTides(userId);

// Check if tide exists
const exists = await storageService.tideExists(userId, tideId);
```

## 🔧 Service Inference

The coordinator automatically routes requests to appropriate services:

| Request Type | Inferred Service | Confidence |
|--------------|------------------|------------|
| `service: "explicit"` | Any service | 100% |
| `timeframe`, `trends` | insights | 80-95% |
| `question`, `query` | questions | 95% |
| `report_type` | reports | 90% |
| `preferences` | preferences | 85-90% |
| `schedule`, `optimization` | optimize | 70-85% |
| Ambiguous requests | chat | Default |

## 📱 iOS Integration

### iOS Integration Example

```typescript
const BASE_URL = process.env.AGENT_BASE_URL || 'https://tides-agent-102.mpazbot.workers.dev';

const response = await fetch(`${BASE_URL}/coordinator`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: 'tides_userId_randomId',
    tides_id: 'your-tide-id',
    message: 'Your productivity request'
    // No 'service' field needed - auto-inferred
  })
});
```

### Available Endpoint
- `POST /coordinator` - All services accessed through intelligent routing

## 🧪 Testing

### Streamlit Testing Interface
**Primary testing method** - Visual interface for comprehensive agent testing:
```bash
cd apps/demo/st_client
streamlit run app.py
```

**Features:**
- **MCP Tools tab** - Get tide IDs using `tide_list` and other MCP tools
- **API Tests tab** - Test individual services with point-and-click interface
- **Agent Chat tab** - Test tide-aware conversational AI with contextual responses
- **Monitoring tab** - View system status and metrics

### Unit Tests
```bash
npm test                    # Run all tests
npm test services           # Test services only
npm test utils             # Test utilities only
```

### Live Testing (Command Line)
```bash
# Test coordinator with inference
curl -X POST ${AGENT_BASE_URL}/coordinator \
  -H "Content-Type: application/json" \
  -d '{"api_key":"your-api-key","tides_id":"your-tide","timeframe":"7d"}'
```

## 📝 Development Guidelines

1. **Authentication**: All requests require valid API keys
2. **Service Inference**: Let coordinator auto-route based on request content
3. **Error Handling**: Always check `response.success` before accessing `data`
4. **Performance**: Expect 50-600ms response times depending on complexity
5. **Testing**: Use explicit `service` field during development for predictable routing

## 🔄 Recent Updates (September 2025)

- ✅ **Simplified Deployment** - Stable iOS environments: Agent 102 + MCP Server 006
- ✅ All 6 services fully operational with **authentic production data** (no mock responses)
- ✅ **Tide-aware Chat Service** - Contextual AI responses using real tide data
- ✅ **Conversational-first Chat** - 85% confidence threshold for natural interaction
- ✅ **Data Integrity Overhaul** - Removed all mock/fabricated data from insights, reports, optimize services
- ✅ **Single Coordinator Endpoint** - All services accessed through `/coordinator` with intelligent routing
- ✅ **Streamlit Testing Interface** - Comprehensive testing tool for agent services
- ✅ **Unified Storage** - Single R2 bucket `tides-006-storage` for all data

## 📞 Support

**Environment**: Production ready  
**Status**: All systems operational  
**Performance**: Within acceptable ranges  
**Integration**: Ready for iOS deployment

---

*Documentation last updated: September 2025*  
*All services validated and production ready*