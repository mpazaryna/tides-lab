# Workers AI Gateway Integration Specification

## Executive Summary

This document outlines the architecture and implementation strategy for integrating Cloudflare Workers AI and AI Gateway with the Tides MCP server, enabling intelligent automation, pattern recognition, and AI-powered decision making throughout the system.

## Background

Cloudflare provides two complementary AI services:
- **Workers AI**: Run inference directly on Cloudflare's edge network using pre-trained models
- **AI Gateway**: Unified API proxy for managing requests to various AI providers (OpenAI, Anthropic, etc.)

The Tides MCP server can leverage both services to provide intelligent features while maintaining cost efficiency and performance.

## Architecture Overview

```
┌─────────────────┐
│ React Native    │
│      App        │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐      AI Requests      ┌──────────────────┐
│   Tides MCP     │◄─────────────────────►│   AI Gateway     │
│     Server      │                       │    (Proxy)       │
└────────┬────────┘                       └────────┬─────────┘
         │                                         │
         │ Direct Inference                        │ Route to Provider
         ▼                                         ▼
┌─────────────────┐                        ┌──────────────────┐
│   Workers AI    │                        │ External AI APIs │
│ (Edge Inference)│                        │ (OpenAI, Claude) │
└─────────────────┘                        └──────────────────┘
```

## Integration Architecture

### MCP Server as AI Orchestrator

```gherkin
Feature: AI-Enhanced MCP Tools
  As a Tides MCP Server
  I want to integrate AI capabilities into my tools
  So that I can provide intelligent automation and insights

  Scenario: Smart flow session analysis
    Given a user completes a flow session
    When the MCP server's analyze_session tool is called
    Then it should send session data to Workers AI
    And use the Llama model to extract productivity insights
    And return structured analysis to the client
    And cache results in KV for future reference

  Scenario: Intelligent scheduling suggestions
    Given a user requests optimal flow timing
    When the MCP server's suggest_schedule tool is called
    Then it should aggregate historical session data
    And send patterns to AI Gateway for complex analysis
    And receive scheduling recommendations
    And return personalized time slots to the client
```

### Dual AI Strategy

```gherkin
Feature: Hybrid AI Processing
  As a system architect
  I want to use both Workers AI and AI Gateway strategically
  So that I optimize for cost, speed, and capabilities

  Scenario: Choose Workers AI for edge inference
    Given a task requires quick, simple AI processing
    When evaluating which AI service to use
    Then use Workers AI for:
      | Use Case                  | Model              | Rationale           |
      | Text classification       | DistilBERT         | Fast, lightweight   |
      | Energy level prediction   | Llama 3.1 8B       | Edge-optimized      |
      | Session summarization     | Mistral 7B         | Cost-effective      |
      | Pattern detection         | Custom fine-tuned  | Proprietary logic   |

  Scenario: Choose AI Gateway for complex tasks
    Given a task requires advanced reasoning or large context
    When evaluating which AI service to use
    Then use AI Gateway for:
      | Use Case                  | Provider    | Model           | Rationale              |
      | Long-form content analysis| Anthropic   | Claude 3.5      | Superior context       |
      | Code generation           | OpenAI      | GPT-4           | Best code capabilities |
      | Multi-modal analysis      | OpenAI      | GPT-4V          | Image understanding    |
      | Complex planning          | Anthropic   | Claude 3 Opus   | Advanced reasoning     |
```

## MCP Tool Implementation

### AI-Powered MCP Tools

```typescript
// Example tool definition in server.ts
export const aiTools = {
  analyze_productivity: {
    description: "Analyze productivity patterns using AI",
    inputSchema: z.object({
      sessions: z.array(z.object({
        duration: z.number(),
        energy_level: z.number(),
        completed_at: z.string(),
        productivity_score: z.number()
      })),
      analysis_depth: z.enum(["quick", "detailed"])
    }),
    handler: async ({ sessions, analysis_depth }, env: Env) => {
      if (analysis_depth === "quick") {
        // Use Workers AI for fast edge inference
        const ai = new Ai(env.AI);
        const response = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
          prompt: `Analyze these productivity sessions: ${JSON.stringify(sessions)}`,
          max_tokens: 200
        });
        return { analysis: response.response, source: "workers-ai" };
      } else {
        // Use AI Gateway for detailed analysis
        const response = await fetch(`${env.AI_GATEWAY_URL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${env.AI_GATEWAY_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'claude-3-sonnet',
            messages: [{
              role: 'system',
              content: 'You are a productivity analysis expert.'
            }, {
              role: 'user',
              content: `Provide detailed analysis of these sessions: ${JSON.stringify(sessions)}`
            }],
            max_tokens: 1000
          })
        });
        const data = await response.json();
        return { analysis: data.choices[0].message.content, source: "ai-gateway" };
      }
    }
  },

  generate_flow_suggestions: {
    description: "Generate AI-powered flow session suggestions",
    inputSchema: z.object({
      user_context: z.object({
        energy_level: z.number(),
        recent_sessions: z.array(z.any()),
        preferences: z.record(z.any())
      })
    }),
    handler: async ({ user_context }, env: Env) => {
      // Use Workers AI for real-time suggestions
      const ai = new Ai(env.AI);
      const embedding = await ai.run('@cf/baai/bge-base-en-v1.5', {
        text: JSON.stringify(user_context)
      });
      
      // Find similar successful sessions using vector similarity
      const similar_sessions = await findSimilarSessions(embedding, env.VECTORIZE);
      
      // Generate suggestions based on similar patterns
      const suggestions = await ai.run('@cf/mistral/mistral-7b-instruct', {
        prompt: `Based on these successful sessions: ${JSON.stringify(similar_sessions)}, 
                 suggest optimal flow sessions for user context: ${JSON.stringify(user_context)}`,
        max_tokens: 300
      });
      
      return { suggestions: suggestions.response };
    }
  }
};
```

### MCP Resources with AI Enhancement

```gherkin
Feature: AI-Enhanced Resources
  As an MCP server
  I want to provide AI-enriched resources
  So that clients receive intelligent, contextual information

  Scenario: Provide AI-analyzed metrics
    Given a client requests the productivity_metrics resource
    When the MCP server prepares the resource
    Then it should include AI-generated insights
    And trend predictions from Workers AI
    And personalized recommendations

  Scenario: Dynamic resource generation
    Given a client requests a personalized_tips resource
    When the MCP server generates the resource
    Then it should use AI to create custom content
    Based on the user's historical patterns
    And current context
```

## AI Gateway Configuration

### Gateway Benefits

```gherkin
Feature: AI Gateway Management
  As a Tides system
  I want to use AI Gateway for external AI providers
  So that I can manage costs, rate limits, and observability

  Scenario: Unified API management
    Given multiple AI providers are needed
    When configuring AI Gateway
    Then it should provide:
      | Feature              | Benefit                                    |
      | Single endpoint      | Simplified API management                  |
      | Rate limiting        | Prevent unexpected costs                   |
      | Caching              | Reduce redundant API calls                 |
      | Analytics            | Track usage and performance                |
      | Fallback providers   | Automatic failover if primary fails        |
      | Request logging      | Debug and audit AI interactions            |

  Scenario: Cost optimization
    Given AI API calls can be expensive
    When routing through AI Gateway
    Then it should:
      | Strategy            | Implementation                              |
      | Cache responses     | Store frequent queries for 1 hour           |
      | Rate limit by user  | Max 100 requests per user per day           |
      | Use cheaper models  | Route simple tasks to GPT-3.5 vs GPT-4      |
      | Batch requests      | Combine multiple small requests             |
```

### Gateway Configuration

```typescript
// wrangler.toml configuration
[ai_gateway]
name = "tides-ai-gateway"
id = "your-gateway-id"

[[ai_gateway.providers]]
name = "openai"
type = "openai"
api_key_env = "OPENAI_API_KEY"

[[ai_gateway.providers]]
name = "anthropic"  
type = "anthropic"
api_key_env = "ANTHROPIC_API_KEY"

[[ai_gateway.rules]]
provider = "openai"
rate_limit = "100/hour"
cache_ttl = 3600

[[ai_gateway.rules]]
provider = "anthropic"
rate_limit = "50/hour"
cache_ttl = 7200
```

## Workers AI Integration

### Available Models for Tides

```gherkin
Feature: Workers AI Model Selection
  As a Tides developer
  I want to choose appropriate Workers AI models
  So that I optimize for performance and cost

  Scenario: Text generation for summaries
    Given I need to generate session summaries
    When selecting a Workers AI model
    Then I should use:
      | Model                         | Use Case                      | Speed  |
      | @cf/mistral/mistral-7b        | General summaries             | Fast   |
      | @cf/meta/llama-3.1-8b         | Detailed analysis             | Medium |
      | @cf/tinyllama/tinyllama-1.1b  | Quick classifications         | Instant|

  Scenario: Embeddings for similarity search
    Given I need to find similar flow patterns
    When creating embeddings
    Then I should use:
      | Model                         | Dimension | Quality |
      | @cf/baai/bge-base-en-v1.5     | 768       | High    |
      | @cf/baai/bge-small-en-v1.5    | 384       | Medium  |

  Scenario: Sentiment analysis for energy tracking
    Given I need to analyze user mood and energy
    When processing text inputs
    Then I should use:
      | Model                         | Task                 | Accuracy |
      | @cf/huggingface/distilbert    | Sentiment analysis   | High     |
```

### Implementation Examples

```typescript
// MCP tool using Workers AI
export const smartTools = {
  predict_energy_level: {
    description: "Predict upcoming energy levels using AI",
    inputSchema: z.object({
      historical_data: z.array(z.object({
        timestamp: z.string(),
        energy: z.number(),
        activity: z.string()
      })),
      future_timestamp: z.string()
    }),
    handler: async ({ historical_data, future_timestamp }, env: Env) => {
      const ai = new Ai(env.AI);
      
      // Generate embeddings for pattern matching
      const embeddings = await ai.run('@cf/baai/bge-small-en-v1.5', {
        text: JSON.stringify(historical_data)
      });
      
      // Find similar historical patterns
      const similar_patterns = await env.VECTORIZE.query(embeddings.data[0], {
        topK: 5,
        namespace: "energy-patterns"
      });
      
      // Predict based on similar patterns
      const prediction = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
        prompt: `Based on these similar energy patterns: ${JSON.stringify(similar_patterns)},
                 predict the energy level at ${future_timestamp}`,
        max_tokens: 100
      });
      
      return {
        predicted_energy: parseFloat(prediction.response),
        confidence: similar_patterns.matches[0].score,
        based_on_patterns: similar_patterns.matches.length
      };
    }
  }
};
```

## Data Flow Patterns

### Request Flow Through MCP to AI

```gherkin
Feature: AI Request Flow
  As a system architect
  I want to define clear AI request patterns
  So that the MCP server efficiently handles AI operations

  Scenario: Client requests AI-powered analysis
    Given a React Native app calls an MCP tool
    When the tool requires AI processing
    Then the flow should be:
      | Step | Component      | Action                                    |
      | 1    | Client App     | Calls MCP tool via protocol               |
      | 2    | MCP Server     | Receives request, validates input         |
      | 3    | MCP Tool       | Determines AI strategy (Workers/Gateway)  |
      | 4    | AI Service     | Processes request                         |
      | 5    | MCP Tool       | Formats AI response                       |
      | 6    | MCP Server     | Returns structured result to client       |

  Scenario: Autonomous agent requests AI assistance
    Given a TideAgent needs AI analysis
    When processing user patterns
    Then the flow should be:
      | Step | Component      | Action                                    |
      | 1    | TideAgent      | Identifies need for AI analysis           |
      | 2    | Agent          | Calls MCP server tool directly            |
      | 3    | MCP Tool       | Routes to appropriate AI service          |
      | 4    | AI Service     | Generates insights                        |
      | 5    | MCP Tool       | Returns to agent                          |
      | 6    | Agent          | Acts on AI recommendations                |
```

## Performance Optimization

```gherkin
Feature: AI Performance Optimization
  As a system
  I want to optimize AI operations
  So that users experience fast, efficient AI features

  Scenario: Implement intelligent caching
    Given AI responses can be expensive and slow
    When implementing caching strategy
    Then use:
      | Cache Layer     | Duration | Use Case                           |
      | KV Store        | 1 hour   | Frequent, identical queries        |
      | Durable Object  | Session  | User-specific predictions          |
      | AI Gateway      | 24 hours | Expensive external API calls       |
      | Edge Cache      | 5 mins   | Real-time suggestions              |

  Scenario: Minimize latency
    Given users expect quick responses
    When designing AI integration
    Then optimize by:
      | Strategy              | Implementation                         |
      | Parallel processing   | Run multiple AI calls concurrently     |
      | Precomputation       | Generate common insights ahead of time  |
      | Model selection      | Use smaller models for real-time needs  |
      | Edge inference       | Prefer Workers AI over external APIs    |
```

## Security and Privacy

```gherkin
Feature: AI Security
  As a system handling user data
  I want to ensure AI operations are secure
  So that user privacy is protected

  Scenario: Sanitize data before AI processing
    Given user data may contain sensitive information
    When sending data to AI services
    Then the MCP server should:
      | Action                | Implementation                       |
      | Remove PII            | Strip names, emails, identifiers     |
      | Anonymize sessions    | Use session IDs, not user IDs        |
      | Aggregate data        | Process patterns, not individual data|
      | Local processing      | Prefer Workers AI to keep data in CF |

  Scenario: Secure API key management
    Given AI services require API keys
    When configuring the system
    Then:
      | Component      | Key Storage                             |
      | Workers AI     | No keys needed (integrated)             |
      | AI Gateway     | Stored in Cloudflare secrets            |
      | MCP Server     | Access via env.AI_GATEWAY_TOKEN         |
      | Client Apps    | Never expose AI keys to clients         |
```

## Monitoring and Observability

```gherkin
Feature: AI Operations Monitoring
  As a platform operator
  I want to monitor AI usage and performance
  So that I can optimize costs and quality

  Scenario: Track AI metrics
    Given AI operations need monitoring
    When implementing observability
    Then track:
      | Metric               | Purpose                        | Alert Threshold |
      | Request latency      | Performance monitoring         | > 2 seconds     |
      | Token usage          | Cost management                | > $100/day      |
      | Error rate           | Reliability tracking           | > 5%            |
      | Cache hit ratio      | Optimization effectiveness     | < 30%           |
      | Model accuracy       | Quality assurance              | User reported   |

  Scenario: Implement cost controls
    Given AI can be expensive at scale
    When setting up cost management
    Then implement:
      | Control              | Configuration                        |
      | Daily spend limits   | $50 per day across all services      |
      | Per-user quotas      | 100 AI requests per user per day     |
      | Model tiering        | Use cheaper models for basic tasks   |
      | Alert thresholds     | Notify at 80% of daily budget        |
```

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
- Configure AI Gateway with provider credentials
- Set up Workers AI bindings in wrangler.toml
- Create basic MCP tools that use AI
- Implement caching strategy

### Phase 2: Intelligence Layer (Week 2)
- Develop energy prediction models
- Create session analysis tools
- Implement pattern recognition
- Add AI-powered scheduling

### Phase 3: Advanced Features (Week 3)
- Multi-modal analysis (if needed)
- Custom model fine-tuning
- Advanced agent reasoning
- Collaborative AI features

### Phase 4: Optimization (Week 4)
- Performance tuning
- Cost optimization
- Cache effectiveness
- User feedback integration

## Example MCP Server Configuration

```typescript
// server.ts with AI integration
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { Ai } from '@cloudflare/ai';

export function createServer(env: Env) {
  const server = new Server({
    name: 'tides-mcp-server',
    version: '1.0.0'
  });

  // Register AI-enhanced tools
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'analyze_flow_session',
        description: 'AI-powered analysis of flow sessions',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: { type: 'string' },
            use_advanced_ai: { type: 'boolean' }
          }
        }
      },
      {
        name: 'predict_optimal_time',
        description: 'Predict best time for next flow session',
        inputSchema: {
          type: 'object',
          properties: {
            user_patterns: { type: 'array' },
            lookahead_days: { type: 'number' }
          }
        }
      }
    ]
  }));

  // Handle AI-powered tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    
    switch (name) {
      case 'analyze_flow_session':
        const ai = new Ai(env.AI);
        const analysis = await analyzeWithAI(ai, args, env);
        return { content: [{ type: 'text', text: JSON.stringify(analysis) }] };
      
      case 'predict_optimal_time':
        const prediction = await predictWithGateway(args, env);
        return { content: [{ type: 'text', text: JSON.stringify(prediction) }] };
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  return server;
}
```

## Testing Strategy

```gherkin
Feature: AI Integration Testing
  As a development team
  I want to test AI integrations thoroughly
  So that the system is reliable and cost-effective

  Scenario: Test Workers AI integration
    Given the MCP server uses Workers AI
    When running integration tests
    Then verify:
      | Test Case                | Expected Result                |
      | Model availability       | All required models accessible |
      | Response format          | Consistent JSON structure      |
      | Error handling           | Graceful fallback on failure   |
      | Performance              | < 500ms for edge inference     |

  Scenario: Test AI Gateway integration
    Given the MCP server uses AI Gateway
    When running integration tests
    Then verify:
      | Test Case                | Expected Result                |
      | Provider routing         | Correct provider selected      |
      | Rate limiting            | Requests blocked when exceeded |
      | Caching                  | Duplicate requests cached      |
      | Fallback                 | Secondary provider activates   |
```

## Conclusion

The integration of Workers AI and AI Gateway with the Tides MCP server creates a powerful, intelligent system that can:
- Provide real-time AI insights at the edge
- Leverage advanced AI models through the gateway
- Maintain cost efficiency through strategic routing
- Ensure privacy through local processing when possible
- Scale globally on Cloudflare's network

The MCP server acts as the orchestration layer, intelligently routing requests to the appropriate AI service based on the task requirements, ensuring optimal performance and cost management.

---

*This specification provides the blueprint for creating an AI-powered MCP server that enhances the Tides system with intelligent automation and insights.*