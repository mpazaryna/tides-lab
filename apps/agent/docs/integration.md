# Tides Agent Integration Guide

## Frontend Integration Patterns

### Modern Agent-First Approach

The Tides Agent is designed for **conversational interfaces** rather than traditional REST APIs. Instead of building complex UI forms, create a **natural language interface** that lets users express their productivity needs in plain English.

## Core Integration Pattern

### Single Endpoint Design
```typescript
const AGENT_BASE_URL = 'https://tides-agent-102.mpazbot.workers.dev';

interface AgentRequest {
  message: string;           // Natural language request
  api_key: string;          // User authentication  
  tides_id: string;         // Productivity context
  timestamp?: string;       // Request timestamp
}

interface AgentResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata: {
    service: string;        // Which capability was used
    inference?: {           // AI routing information
      confidence: number;
      reasoning: string;
    };
    processing_time_ms: number;
    timestamp: string;
  };
}
```

### Basic Integration
```typescript
class TidesAgent {
  private apiKey: string;
  private baseUrl: string;
  
  constructor(apiKey: string, environment = 'staging') {
    this.apiKey = apiKey;
    this.baseUrl = environment === 'production' 
      ? 'https://tides-agent-101.mpazbot.workers.dev'
      : 'https://tides-agent-102.mpazbot.workers.dev';
  }
  
  async ask(message: string, tideId: string): Promise<AgentResponse> {
    const response = await fetch(`${this.baseUrl}/coordinator`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        api_key: this.apiKey,
        tides_id: tideId,
        timestamp: new Date().toISOString()
      })
    });
    
    return response.json();
  }
}
```

## UI/UX Patterns

### 1. Conversational Interface (Recommended)

Instead of complex forms, provide a **chat-like interface**:

```tsx
function ProductivityChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const agent = new TidesAgent(userApiKey);
  
  const handleSend = async () => {
    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    
    const response = await agent.ask(input, currentTideId);
    
    if (response.success) {
      const agentMessage = {
        role: 'assistant',
        content: formatAgentResponse(response.data),
        metadata: response.metadata
      };
      setMessages(prev => [...prev, agentMessage]);
    }
    
    setInput('');
  };
  
  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
      </div>
      <ChatInput 
        value={input}
        onChange={setInput}
        onSend={handleSend}
        placeholder="Ask about your productivity..."
      />
    </div>
  );
}
```

### 2. Smart Widgets

Create **intelligent widgets** that use natural language queries:

```tsx
function ProductivityInsightsWidget() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const agent = new TidesAgent(userApiKey);
  
  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      const response = await agent.ask(
        "Show me my productivity patterns for the past week",
        currentTideId
      );
      
      if (response.success) {
        setInsights(response.data);
      }
      setLoading(false);
    };
    
    fetchInsights();
  }, [currentTideId]);
  
  return (
    <div className="insights-widget">
      <h3>Your Productivity This Week</h3>
      {loading ? <Spinner /> : <InsightsDisplay data={insights} />}
    </div>
  );
}
```

### 3. Context-Aware Suggestions

Use the agent to provide **proactive suggestions**:

```tsx
function ProductivitySuggestions() {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const agent = new TidesAgent(userApiKey);
  
  useEffect(() => {
    const getSuggestions = async () => {
      const now = new Date();
      const timeContext = `It's ${now.getHours()}:${now.getMinutes()} on ${now.toDateString()}`;
      
      const response = await agent.ask(
        `Based on my patterns, what should I focus on right now? ${timeContext}`,
        currentTideId
      );
      
      if (response.success && response.data.recommendations) {
        setSuggestions(response.data.recommendations);
      }
    };
    
    getSuggestions();
  }, [currentTideId]);
  
  return (
    <div className="suggestions">
      <h4>Suggestions for Right Now</h4>
      {suggestions.map((suggestion, i) => (
        <SuggestionCard key={i} text={suggestion} />
      ))}
    </div>
  );
}
```

## React Native Integration

### Service Hook Pattern
```typescript
import { useState, useCallback } from 'react';

export function useTidesAgent(apiKey: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const agent = useMemo(() => new TidesAgent(apiKey), [apiKey]);
  
  const ask = useCallback(async (message: string, tideId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await agent.ask(message, tideId);
      
      if (!response.success) {
        setError(response.error || 'Request failed');
        return null;
      }
      
      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [agent]);
  
  return { ask, loading, error };
}
```

### Component Usage
```tsx
function ProductivityScreen() {
  const { apiKey, currentTideId } = useAuth();
  const { ask, loading, error } = useTidesAgent(apiKey);
  const [insights, setInsights] = useState(null);
  
  const refreshInsights = useCallback(async () => {
    const data = await ask("What are my productivity insights for today?", currentTideId);
    if (data) {
      setInsights(data);
    }
  }, [ask, currentTideId]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Productivity</Text>
      
      {loading && <ActivityIndicator />}
      {error && <ErrorMessage error={error} />}
      {insights && <ProductivitySummary data={insights} />}
      
      <TouchableOpacity onPress={refreshInsights} style={styles.refreshButton}>
        <Text>Refresh Insights</Text>
      </TouchableOpacity>
      
      <ProductivityChat agent={{ ask, loading }} tideId={currentTideId} />
    </View>
  );
}
```

## Advanced Integration Patterns

### 1. Context Management
```typescript
interface ProductivityContext {
  currentTideId: string;
  recentActivity: string[];
  userPreferences: UserPreferences;
  timeOfDay: 'morning' | 'afternoon' | 'evening';
}

class ContextAwareTidesAgent extends TidesAgent {
  private context: ProductivityContext;
  
  constructor(apiKey: string, context: ProductivityContext) {
    super(apiKey);
    this.context = context;
  }
  
  async askWithContext(message: string): Promise<AgentResponse> {
    // Enhance message with context
    const contextualMessage = `
${message}

Context: 
- Current time: ${this.context.timeOfDay}
- Recent activity: ${this.context.recentActivity.join(', ')}
- User preferences: ${JSON.stringify(this.context.userPreferences)}
    `.trim();
    
    return this.ask(contextualMessage, this.context.currentTideId);
  }
}
```

### 2. Response Processing
```typescript
interface ProcessedAgentResponse {
  displayText: string;
  actionItems?: string[];
  recommendations?: string[];
  data?: any;
  visualizations?: ChartConfig[];
}

function processAgentResponse(response: AgentResponse): ProcessedAgentResponse {
  const { data, metadata } = response;
  
  switch (metadata.service) {
    case 'insights':
      return {
        displayText: `Your productivity score is ${data.productivity_score}/100`,
        recommendations: data.recommendations,
        visualizations: createInsightsCharts(data),
        data: data
      };
      
    case 'optimize':
      return {
        displayText: 'Here\'s your optimized schedule:',
        actionItems: data.recommendations,
        data: data.schedule_blocks
      };
      
    case 'chat':
      return {
        displayText: data.message,
        actionItems: data.suggested_actions,
        data: data
      };
      
    default:
      return {
        displayText: JSON.stringify(data, null, 2),
        data: data
      };
  }
}
```

### 3. Caching & Performance
```typescript
class CachedTidesAgent extends TidesAgent {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  
  async ask(message: string, tideId: string): Promise<AgentResponse> {
    const cacheKey = `${message}-${tideId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return {
        success: true,
        data: cached.data,
        metadata: {
          service: 'cache',
          processing_time_ms: 1,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    const response = await super.ask(message, tideId);
    
    if (response.success) {
      this.cache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now()
      });
    }
    
    return response;
  }
}
```

## Error Handling Patterns

### Graceful Degradation
```typescript
async function getProductivityInsights(tideId: string): Promise<InsightsData> {
  try {
    const response = await agent.ask("Show me my productivity insights", tideId);
    
    if (response.success) {
      return response.data;
    }
    
    // Fallback to cached data
    const cached = await getCachedInsights(tideId);
    if (cached) {
      return { ...cached, note: 'Showing cached data - agent temporarily unavailable' };
    }
    
    // Final fallback to default structure
    return {
      productivity_score: 0,
      trends: { daily_average: 0, weekly_pattern: [] },
      recommendations: ['Unable to load insights - please try again later'],
      note: 'Agent unavailable'
    };
    
  } catch (error) {
    console.error('Agent request failed:', error);
    return getDefaultInsights();
  }
}
```

### User-Friendly Error Messages
```tsx
function formatAgentError(error: string): string {
  const errorMappings = {
    'Invalid API key': 'Please check your authentication settings',
    'Tide data not found': 'No productivity data available for this period',
    'Service timeout': 'The request is taking longer than usual - please try again',
    'Insufficient data': 'Not enough data to generate insights - try logging more activities'
  };
  
  return errorMappings[error] || 'Something went wrong - please try again';
}
```

## Testing Integration

### Mock Agent for Development
```typescript
class MockTidesAgent extends TidesAgent {
  async ask(message: string, tideId: string): Promise<AgentResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const mockResponses = {
      'productivity insights': {
        success: true,
        data: { productivity_score: 85, recommendations: ['Focus on morning tasks'] },
        metadata: { service: 'insights', processing_time_ms: 250, timestamp: new Date().toISOString() }
      },
      'schedule optimization': {
        success: true,
        data: { recommendations: ['Block 9-11 AM for deep work'] },
        metadata: { service: 'optimize', processing_time_ms: 180, timestamp: new Date().toISOString() }
      }
    };
    
    const key = Object.keys(mockResponses).find(k => message.toLowerCase().includes(k));
    return mockResponses[key] || {
      success: true,
      data: { message: 'This is a mock response for development' },
      metadata: { service: 'chat', processing_time_ms: 100, timestamp: new Date().toISOString() }
    };
  }
}
```

## Best Practices

### 1. Natural Language Design
- **Use conversational prompts**: "How was my productivity today?" instead of GET /insights?timeframe=1d
- **Provide context**: Include time, user state, and recent activity in requests
- **Handle ambiguity**: Design UI to clarify when agent responses are uncertain

### 2. User Experience
- **Show inference confidence**: Display how confident the agent was in understanding intent
- **Provide fallbacks**: Always have default responses when agent is unavailable
- **Enable refinement**: Let users refine requests if results aren't what they expected

### 3. Performance Optimization
- **Cache frequent queries**: Cache common requests like daily insights
- **Batch related requests**: Combine multiple questions into single agent call
- **Lazy load**: Only request data when user actively engages with productivity features

### 4. Data Privacy
- **Minimize data exposure**: Only send necessary context to agent
- **Respect user preferences**: Honor privacy settings in agent requests
- **Secure transmission**: Always use HTTPS and validate API keys

---

## Migration from Traditional APIs

If you have existing REST-style integrations, gradually migrate to the conversational pattern:

### Phase 1: Wrapper Integration
Keep existing UI but replace backend calls with agent requests:
```typescript
// Old: GET /insights?timeframe=7d
// New: "Show me my productivity insights for the past week"
```

### Phase 2: Enhanced UX
Add conversational elements while maintaining structured data:
```typescript
// Add chat interface alongside existing dashboards
```

### Phase 3: Full Agent Integration
Replace structured interfaces with natural language interaction:
```typescript
// Primary interface becomes conversational with structured data as secondary
```

---

*Integration patterns designed for Cloudflare Workers AI agent architecture*