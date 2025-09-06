# Tides Agent Documentation

**Comprehensive documentation for the Tides Agent productivity microservices platform.**

## 📚 Documentation Index

### Core Documentation
- **[API Reference](api-reference.md)** - Complete API endpoint documentation with examples
- **[iOS Integration Guide](ios-integration-guide.md)** - Frontend integration guide with TypeScript examples
- **[Chat Agent Architecture](chat-agent-architecture.md)** - AI-powered chat service architecture specification

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
- **Storage**: Environment-specific R2 buckets for tide data, KV for user preferences and auth
- **Data Access**: Single R2 bucket per environment (101: tides-001-storage, 102: tides-002-storage, 103: tides-003-storage)
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

## 🗄️ Environment-Specific Storage Architecture

The Tides Agent uses environment-specific R2 buckets for clean data isolation:

### Environment Configuration
- **Environment 101** (Production): `tides-001-storage` bucket
- **Environment 102** (Staging): `tides-002-storage` bucket  
- **Environment 103** (Development): `tides-003-storage` bucket

### Data Access Strategy
Each environment accesses only its designated bucket:

1. **Isolation**: Each environment has dedicated storage
2. **Simplicity**: Single `TIDES_R2` binding per environment
3. **Predictability**: No fallback complexity, direct bucket access

### Usage Examples

```typescript
// Get tide data from current environment bucket
const data = await storageService.getTideData(userId, tideId);

// Save tide data to current environment bucket
const success = await storageService.saveTideData(userId, tideId, tideData);

// List user tides from current environment
const tides = await storageService.listUserTides(userId);

// Check if tide exists in current environment
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
- ✅ Comprehensive test coverage validation (195 tests)
- ✅ Multi-environment deployment configuration (101, 102, 103)
- ✅ **Environment-specific R2 storage implementation** - Simplified, isolated data access
- ✅ **Unit test directory structure flattening** - Improved test organization
- ✅ **Documentation updates** - Aligned with current implementation

## 📞 Support

**Environment**: Production ready  
**Status**: All systems operational  
**Performance**: Within acceptable ranges  
**Integration**: Ready for iOS deployment

---

*Documentation last updated: September 2025*  
*All services validated and production ready*