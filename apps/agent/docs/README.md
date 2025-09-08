# Tides AI Agent

> **Cloudflare Workers AI Agent** for autonomous productivity intelligence and workflow optimization

## Overview

The Tides Agent is an intelligent AI system built on Cloudflare's serverless platform that understands natural language requests and autonomously determines the best approach to help users optimize their productivity workflows.

## Key Features

### 🤖 **Autonomous Intelligence**
- Natural language understanding with Cloudflare Workers AI
- Intent-based routing to appropriate capabilities
- Goal-directed reasoning for productivity optimization

### 📊 **Real-Time Analytics**
- Live analysis of workflow patterns from R2 storage
- Personalized insights based on actual user data
- Predictive recommendations for productivity improvement

### ⚡ **Adaptive Responses**
- Context-aware conversational AI
- Dynamic capability selection based on user needs
- Personalized coaching and guidance

## Architecture

Built using Cloudflare's modern serverless stack:
- **Workers**: Serverless compute for agent logic
- **Durable Objects**: Stateful coordination and routing
- **Workers AI**: LLM-powered intent recognition (`@cf/meta/llama-3.1-8b-instruct`)
- **R2 Storage**: Real-time productivity data access
- **D1 Database**: Authentication and user management

## Quick Start

### Single Endpoint Design
```bash
curl -X POST https://tides-agent-102.mpazbot.workers.dev/coordinator \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Show me my productivity patterns this week",
    "api_key": "your-api-key",
    "tides_id": "your-tide-id"
  }'
```

### Agent Response
```json
{
  "success": true,
  "data": {
    "productivity_score": 82,
    "trends": {
      "daily_average": 74,
      "weekly_pattern": [90, 125, 105, 135, 95, 80, 65],
      "improvement_areas": ["morning focus", "afternoon energy management"]
    },
    "recommendations": [
      "Schedule deep work between 9-11 AM when you're most focused",
      "Consider shorter breaks during your peak hours",
      "Plan lighter tasks for Friday afternoons"
    ]
  },
  "metadata": {
    "service": "insights",
    "inference": {
      "confidence": 94,
      "reasoning": "AI-powered semantic analysis"
    }
  }
}
```

## Agent Capabilities

### Productivity Intelligence
- **Flow session analysis**: Duration, intensity, patterns
- **Energy tracking**: Peak hours, low periods, optimization opportunities  
- **Task completion insights**: Types, timing, success patterns
- **Trend forecasting**: Predictive productivity modeling

### Conversational AI
- **Natural queries**: "How can I be more productive in the mornings?"
- **Contextual coaching**: Advice based on your actual workflow data
- **Adaptive responses**: Learns from your patterns and preferences
- **Goal-oriented guidance**: Helps achieve specific productivity outcomes

### Workflow Optimization
- **Schedule generation**: AI-optimized time blocking
- **Energy alignment**: Matches tasks to your natural rhythms
- **Focus recommendations**: Suggests optimal work session lengths
- **Habit formation**: Identifies and reinforces productive patterns

## Development

### Testing Interface
```bash
cd apps/demo/st_client
streamlit run app.py
```

Provides visual testing for:
- Agent conversation and routing
- Individual service capabilities  
- MCP tool integration
- Performance monitoring

### Test Coverage
- **212 unit tests** passing ✅
- **66.66% statement coverage**
- **Comprehensive service testing**
- **Authentication and error handling**

## Production Status

### Environments
- **env.101** - Production (iOS deployment)
- **env.102** - Staging (primary development) 
- **env.103** - Development (legacy)

### Performance
- **200-500ms** typical response times
- **Auto-scaling** with Cloudflare Workers
- **Global edge** deployment
- **99.9%** uptime SLA

### Security
- SHA-256 API key validation
- Cloudflare security features
- Rate limiting and DDoS protection
- Secure data handling

## Agent Philosophy

The Tides Agent embodies Cloudflare's vision for intelligent AI systems:

> **"Autonomy, goal-directed reasoning, and adaptive decision-making"**

Rather than requiring users to learn specific commands or navigate complex interfaces, the agent understands natural language intent and autonomously determines the best approach to help achieve productivity goals.

This represents a fundamental shift from traditional software interfaces to **intelligent conversation** as the primary interaction model.

---

## Documentation

- **[API Reference](api.md)** - Complete agent API documentation
- **[Architecture Guide](architecture.md)** - Technical implementation details  
- **[Integration Guide](integration.md)** - Frontend integration patterns

---

*Built with Cloudflare Workers AI • Production Ready • January 2025*