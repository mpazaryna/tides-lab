# Tides Agent

**Productivity microservices platform for iOS integration**

## 🔧 Environment Variables

**Required configuration for stable testing environments:**

```bash
AGENT_BASE_URL=https://tides-agent-102.mpazbot.workers.dev
MCP_SERVER_URL=https://tides-006.mpazbot.workers.dev
```

## 📚 Documentation

- **[API](api.md)** - API endpoints and examples
- **[iOS](ios.md)** - iOS integration guide  
- **[Chat](chat.md)** - Chat service implementation

## 🚀 Quick Start

### Basic Integration

```typescript
// Using environment variables
const BASE_URL = process.env.AGENT_BASE_URL;

const response = await fetch(`${BASE_URL}/coordinator`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    api_key: 'tides_userId_randomId',
    tides_id: 'your-tide-id',
    message: 'How productive was I today?'
  })
});
```

### Available Endpoints
- `POST /coordinator` - All services (insights, reports, questions, etc.)
- `POST /chat` - Conversational AI interface

## 🧪 Testing

**Streamlit testing interface:**
```bash
cd apps/demo/st_client
streamlit run app.py
```
