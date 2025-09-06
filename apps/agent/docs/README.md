# Tides Agent Documentation

**Comprehensive documentation for the Tides Agent productivity microservices platform.**

## 📚 Documentation Index

### Core Documentation
- **[API Reference](api-reference.md)** - Complete API endpoint documentation with examples
- **[iOS Integration Guide](ios-integration-guide.md)** - Frontend integration guide with TypeScript examples
- **[Chat Agent Architecture](chat-agent-architecture.md)** - AI-powered chat service architecture specification
- **[Multi-Bucket Storage Guide](multi-bucket-storage.md)** - Cross-environment R2 data access implementation

### Implementation Reports
- **[Chat Service Implementation Report](chat-service-implementation-report.md)** - TDD implementation report with live testing
- **[iOS Mock Response Guide](ios-mock-response.md)** - Production response examples and testing guide
- **[Documentation Audit Report](DOCUMENTATION-AUDIT-REPORT.md)** - Comprehensive documentation validation audit

## 🏗️ System Architecture

### Core Services (All Production Ready)
1. **Insights Service** - Productivity analysis with R2 data integration
2. **Optimize Service** - Schedule optimization recommendations  
3. **Questions Service** - AI-powered productivity Q&A
4. **Preferences Service** - User settings and preferences management
5. **Reports Service** - Comprehensive productivity reporting
6. **Chat Service** - AI intent clarification and response enhancement

### Technical Stack
- **Platform**: Cloudflare Workers with Durable Objects
- **Storage**: Multi-bucket R2 for tide data, KV for user preferences and auth
- **Multi-Source Data Access**: Automatic fallback across agent and server R2 buckets
- **AI Integration**: Cloudflare Workers AI for chat responses
- **Authentication**: SHA-256 hashed API keys with KV validation
- **Architecture**: Microservices coordination with intelligent routing

## 🚀 Quick Start

### Base URL
```
https://tides-agent-101.mpazbot.workers.dev
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

### Test Coverage (Verified)
- **Services**: 84.48% statement coverage
- **Overall**: 68.37% statement coverage  
- **Total Tests**: 187 passing tests
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

## 🗄️ Multi-Bucket Storage Architecture

The Tides Agent supports accessing tide data from multiple R2 buckets within the same Cloudflare account:

### Available Buckets
- **Agent Bucket**: `TIDES_R2` - Primary storage for agent environment
- **Server Buckets**: 
  - `TIDES_SERVER_001` - Production server data
  - `TIDES_SERVER_002` - Staging server data  
  - `TIDES_SERVER_003` - Development server data

### Data Access Strategy
The storage service implements intelligent fallback:

1. **Primary**: Check agent bucket first (fastest access)
2. **Fallback**: Search server buckets in order (001 → 002 → 003)
3. **Aggregation**: Combine results from all sources for comprehensive data access

### Usage Examples

```typescript
// Fetch from specific server bucket
const data = await storageService.getTideDataFromServer(userId, tideId, 'TIDES_SERVER_001');

// Auto-search across all buckets
const data = await storageService.getTideDataFromAnySource(userId, tideId);

// List tides from all sources with deduplication
const allTides = await storageService.listUserTidesFromAllSources(userId);

// Get bucket configuration info
const bucketInfo = await storageService.getBucketInfo();
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

### Recommended Approach
Use the coordinator endpoint with smart inference:

```typescript
const response = await fetch(`${BASE_URL}/coordinator`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: 'your-api-key',
    tides_id: 'your-tide-id',
    message: 'Your productivity request'
    // No 'service' field needed - auto-inferred
  })
});
```

### Legacy Direct Endpoints
All services support direct access:
- `POST /insights`
- `POST /optimize` 
- `POST /questions`
- `POST /preferences`
- `POST /reports`
- `POST /chat`

## 🧪 Testing

### Unit Tests
```bash
npm test                    # Run all tests
npm test services           # Test services only
npm test utils             # Test utilities only
```

### Live Testing
```bash
# Test coordinator with inference
curl -X POST https://tides-agent-101.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{"api_key":"your-key","tides_id":"your-tide","timeframe":"7d"}'
```

## 📝 Development Guidelines

1. **Authentication**: All requests require valid API keys
2. **Service Inference**: Let coordinator auto-route based on request content
3. **Error Handling**: Always check `response.success` before accessing `data`
4. **Performance**: Expect 50-600ms response times depending on complexity
5. **Testing**: Use explicit `service` field during development for predictable routing

## 🔄 Recent Updates (September 2025)

- ✅ All 6 services fully operational with production data
- ✅ Chat service AI integration with Cloudflare Workers AI
- ✅ Service inference engine with 70% confidence threshold
- ✅ Comprehensive test coverage validation (202 tests)
- ✅ Production deployment with performance optimization
- ✅ Documentation audit and accuracy validation complete
- ✅ **Multi-bucket R2 storage implementation** - Cross-environment data access
- ✅ **TDD-driven storage enhancement** - 15 new tests, 91.12% coverage

## 📞 Support

**Environment**: Production ready  
**Status**: All systems operational  
**Performance**: Within acceptable ranges  
**Integration**: Ready for iOS deployment

---

*Documentation last updated: September 2025*  
*All services validated and production ready*