# AI Configuration Guide - Tides Project

This guide explains how to fine-tune the system prompt, AI tone of voice, and agent/worker instructions in the Tides productivity management system.

## Overview

The Tides project uses Cloudflare Workers AI for edge inference with multiple customization points across different architectural layers.

## Key Configuration Files

| File | Purpose | Customization Level |
|------|---------|-------------------|
| `apps/server/src/services/aiService.ts` | Main AI service with conversation prompts | System-wide |
| `apps/server/src/prompts/registry.ts` | Specialized prompt templates | Feature-specific |
| `apps/agents/tide-productivity-agent/agent.ts` | Durable Object agent behavior | Agent-specific |
| `apps/agents/hello/agent.ts` | Demo agent patterns | Reference |

## 1. System Prompt Configuration

### Location
`apps/server/src/services/aiService.ts` → `buildConversationPrompt()` method (lines 555-574)

### Current System Instruction
```typescript
System Instruction: Absolute Mode. Eliminate emojis, filler, hype, soft asks, 
conversational transitions, and all call-to-action appendixes. Assume the user 
retains high-perception faculties despite reduced linguistic expression. 
Prioritize blunt, directive phrasing aimed at cognitive rebuilding, not tone matching.
```

### Customization Points

#### A. Core System Behavior
```typescript
// Location: aiService.ts:555
const systemInstruction = `
  System Instruction: [YOUR_CUSTOM_MODE]. 
  [Define behavior constraints here]
  [Set communication style here]
  [Specify interaction patterns here]
`;
```

#### B. Operating Constraints
```typescript
// Location: aiService.ts:558-564
Operating constraints:
- Maximum [X] words per response        // Currently: 150
- [Response structure preference]       // Currently: One core point
- [Temporal focus]                     // Currently: Present-tense observations
- [Question usage policy]              // Currently: Serve reflection, not data gathering
- [Tool suggestion policy]             // Currently: Only when user requests data
```

#### C. Context Variables
```typescript
// Location: aiService.ts:566-574
Context variables:
- Session ID: ${context.sessionId}
- Time focus: ${timeContext}
- Tide state: ${tideContext}
- Conversation history: ${conversationHistory}
```

## 2. AI Tone of Voice Settings

### Current Characteristics
- **Direct/Blunt**: "Eliminate emojis, filler, hype"
- **Cognitive-Focused**: "Aimed at cognitive rebuilding"
- **Minimal**: "Maximum 150 words per response"
- **Present-Focused**: "Present-tense observations over future imperatives"

### Model Configuration

#### A. Model Selection
```typescript
// Location: aiService.ts:449-456
// Quick responses
const model = "@cf/mistral/mistral-7b-instruct-v0.1";

// Detailed analysis  
const model = "@cf/meta/llama-3.1-8b-instruct";
```

#### B. Add Temperature Control
```typescript
// Current implementation
const response = await this.env.AI.run(model, {
  prompt: conversationPrompt,
  max_tokens: 200,
});

// Enhanced with creativity control
const response = await this.env.AI.run(model, {
  prompt: conversationPrompt,
  max_tokens: 200,
  temperature: 0.7,        // 0.0 = deterministic, 1.0 = creative
  top_p: 0.9,             // Nucleus sampling
  frequency_penalty: 0.1,  // Reduce repetition
});
```

#### C. Response Length Control
```typescript
// Adjust max_tokens based on use case
const responseParams = {
  quick: { max_tokens: 150, model: "@cf/mistral/mistral-7b-instruct-v0.1" },
  detailed: { max_tokens: 400, model: "@cf/meta/llama-3.1-8b-instruct" },
  comprehensive: { max_tokens: 800, model: "@cf/meta/llama-3.1-8b-instruct" }
};
```

### Tone Customization Examples

#### Professional Assistant
```typescript
const systemInstruction = `
  You are a professional productivity assistant. Provide clear, actionable advice 
  with a supportive but focused tone. Use structured responses with bullet points 
  when helpful. Maintain professional courtesy while being direct about next steps.
`;
```

#### Casual Coach
```typescript
const systemInstruction = `
  You're a friendly productivity coach. Keep responses conversational and encouraging. 
  Use examples and analogies to explain concepts. Ask follow-up questions to understand 
  user goals better. Balance being helpful with being concise.
`;
```

#### Technical Analyst
```typescript
const systemInstruction = `
  You are a data-driven productivity analyst. Focus on metrics, patterns, and 
  evidence-based recommendations. Provide specific numbers and measurable insights. 
  Be precise and analytical while remaining accessible.
`;
```

## 3. Agent/Worker Instructions

### Durable Object Agent Architecture

#### A. TideProductivityAgent Configuration
**Location:** `apps/agents/tide-productivity-agent/agent.ts`

```typescript
// Service initialization
private async initialize(): Promise<void> {
  const userContext: UserContext = {
    userId: 'system',
    environment: this.getEnvironment()
  };

  // Configure AI analyzer with custom settings
  this.aiAnalyzer = new AIAnalyzer(this.env.AI, {
    defaultModel: "@cf/mistral/mistral-7b-instruct-v0.1",
    temperature: 0.7,
    maxTokens: 300
  });
}
```

#### B. Handler Customization
```typescript
// Customize endpoint behavior
switch (url.pathname) {
  case '/insights':
    return this.insightsHandler.handleRequest(request);
  case '/optimize':
    return this.optimizeHandler.handleRequest(request);
  case '/custom-endpoint':  // Add new endpoints
    return this.customHandler.handleRequest(request);
}
```

#### C. WebSocket Behavior
```typescript
// Customize real-time communication
private handleWebSocketUpgrade(request: Request): Response {
  const webSocketPair = new WebSocketPair();
  const [client, server] = Object.values(webSocketPair);

  // Add custom connection handling
  this.webSocketManager.handleConnection(server, {
    maxConnections: 100,
    heartbeatInterval: 30000,
    customAuth: true
  });

  return new Response(null, { status: 101, webSocket: client });
}
```

## 4. Prompt Templates

### Location
`apps/server/src/prompts/registry.ts`

### Available Templates
1. **`analyze_tide`** - Comprehensive tide performance analysis
2. **`productivity_insights`** - Pattern identification and optimization
3. **`optimize_energy`** - Energy-aware scheduling recommendations  
4. **`team_insights`** - Multi-user collaboration analysis
5. **`custom_tide_analysis`** - Flexible user-defined analysis

### Template Structure
```typescript
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  your_custom_template: {
    metadata: {
      title: "Custom Analysis Type",
      description: "Description of what this template does",
      version: "1.0.0",
      lastUpdated: "2025-08-17"
    },
    zodSchema: {
      // Input validation schema
      user_input: z.string().describe("User's question or request"),
      analysis_type: z.enum(['quick', 'detailed']).optional()
    },
    contextTemplate: `
      CUSTOM ANALYSIS REQUEST
      
      User Input: {{user_input}}
      Analysis Type: {{analysis_type || 'standard'}}
      
      [Your custom prompt template with {{variable}} substitution]
      
      Please provide analysis focusing on:
      1. [Your specific requirements]
      2. [Expected output format]
      3. [Key insights to highlight]
    `
  }
};
```

### Adding New Templates
```typescript
// 1. Define the template in registry.ts
// 2. Add Zod schema for input validation
// 3. Create contextTemplate with {{variable}} substitution
// 4. Process with existing template engine

const processedPrompt = processTemplate(template.contextTemplate, {
  user_input: "How can I optimize my morning routine?",
  analysis_type: "detailed",
  // Additional context data
});
```

## 5. Environment-Specific Configuration

### Environment Detection
```typescript
private getEnvironment(): 'development' | 'staging' | 'production' {
  const envValue = this.env.ENVIRONMENT;
  
  if (envValue === 'production') return 'production';
  if (envValue === 'staging') return 'staging';
  return 'development';
}
```

### Environment-Specific Settings
```typescript
// Configure different AI behavior per environment
const getAIConfig = (environment: string) => {
  switch (environment) {
    case 'production':
      return {
        model: "@cf/meta/llama-3.1-8b-instruct",
        temperature: 0.5,
        maxTokens: 300,
        systemPrompt: "Professional mode: Provide polished, production-ready responses."
      };
    case 'staging':
      return {
        model: "@cf/mistral/mistral-7b-instruct-v0.1", 
        temperature: 0.7,
        maxTokens: 400,
        systemPrompt: "Testing mode: Include debug information and be verbose."
      };
    case 'development':
      return {
        model: "@cf/mistral/mistral-7b-instruct-v0.1",
        temperature: 0.9,
        maxTokens: 500,
        systemPrompt: "Development mode: Be experimental and show reasoning."
      };
  }
};
```

## 6. Best Practices

### A. Gradual Customization
1. **Start small**: Modify existing prompts before creating new ones
2. **Test thoroughly**: Use different environments for experimentation
3. **Monitor performance**: Track response quality and user satisfaction
4. **Version control**: Use metadata.version in prompt templates

### B. Performance Optimization
```typescript
// Cache configuration for different use cases
const cacheConfig = {
  conversation: 10 * 60 * 1000,    // 10 minutes
  analysis: 30 * 60 * 1000,       // 30 minutes  
  insights: 60 * 60 * 1000        // 1 hour
};

// Model selection based on complexity
const selectModel = (complexity: 'simple' | 'complex') => {
  return complexity === 'simple' 
    ? "@cf/mistral/mistral-7b-instruct-v0.1"    // Faster
    : "@cf/meta/llama-3.1-8b-instruct";         // More capable
};
```

### C. Error Handling
```typescript
// Graceful degradation when AI is unavailable
try {
  const aiResponse = await this.env.AI.run(model, params);
  return aiResponse;
} catch (error) {
  console.error("AI service failed:", error);
  return this.generateFallbackResponse(userInput);
}
```

## 7. Testing Your Changes

### A. Local Development
```bash
# Start development server
npm run dev

# Test specific endpoints
curl -X POST http://localhost:8787/agents/tide-productivity/question \
  -H "Content-Type: application/json" \
  -d '{"message": "Test my custom prompt", "context": {}}'
```

### B. Environment Testing
```bash
# Deploy to staging
wrangler deploy --env staging

# Test with staging environment
curl -X POST https://tides-002.mpazbot.workers.dev/agents/tide-productivity/question \
  -H "Content-Type: application/json" \
  -d '{"message": "Production test", "context": {}}'
```

### C. A/B Testing
```typescript
// Implement prompt variations for testing
const promptVariants = {
  A: "Direct, technical approach...",
  B: "Conversational, supportive approach...", 
  C: "Analytical, data-driven approach..."
};

const selectedPrompt = promptVariants[Math.random() > 0.5 ? 'A' : 'B'];
```

## 8. Monitoring and Metrics

### A. Response Quality Tracking
```typescript
// Add to aiService.ts
private trackResponseMetrics(prompt: string, response: string, userId: string) {
  // Log response length, processing time, user satisfaction
  console.log('AI Response Metrics:', {
    promptLength: prompt.length,
    responseLength: response.length,
    processingTime: Date.now() - startTime,
    userId,
    model: currentModel
  });
}
```

### B. Usage Analytics
```typescript
// Track which prompts and models are most effective
const analyticsData = {
  promptTemplate: templateName,
  model: modelUsed,
  responseTime: processingTime,
  userSatisfaction: feedbackScore,
  environment: this.getEnvironment()
};
```

## Quick Start Checklist

- [ ] Identify your desired AI personality/tone
- [ ] Modify system instruction in `aiService.ts:555`
- [ ] Adjust operating constraints (word limits, style)
- [ ] Test with development environment
- [ ] Create custom prompt template if needed
- [ ] Configure model parameters (temperature, max_tokens)
- [ ] Deploy to staging for testing
- [ ] Monitor response quality and adjust
- [ ] Deploy to production

## Support

For questions about AI configuration:
1. Check existing prompt templates in `prompts/registry.ts`
2. Review agent implementations in `apps/agents/`
3. Test changes in development environment first
4. Use Context7 MCP for Cloudflare Workers AI documentation

---

*Last updated: 2025-08-17*
*Version: 1.0.0*