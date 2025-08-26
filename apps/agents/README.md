# Tides Agents

This directory contains Cloudflare Durable Object agents that provide autonomous functionality for the Tides system.

## HelloAgent

A simple test agent to demonstrate the agent pattern and test infrastructure.

## TideProductivityAgent

An AI-powered productivity agent that provides intelligent analysis of workflow patterns and productivity insights using the MCP prompts system.

### Key Features

- **AI-Powered Analysis**: Uses all 5 MCP analysis prompts for comprehensive insights
- **Intelligent Recommendations**: Provides actionable scheduling and optimization suggestions
- **Energy Pattern Analysis**: Analyzes energy patterns and provides optimization strategies
- **Workflow Insights**: Generates detailed productivity reports and trend analysis
- **Multi-User Support**: Supports team collaboration analysis and insights

### Endpoints

#### REST API

- `GET /agents/tide-productivity/analyze` - Get AI productivity analysis for user's active tides
- `POST /agents/tide-productivity/analyze` - Request custom analysis with specific parameters
- `GET /agents/tide-productivity/insights` - Get cached productivity insights
- `GET /agents/tide-productivity/stats` - Get agent statistics and performance metrics

#### MCP Integration

The agent leverages the complete MCP interface:

**MCP Prompts Used:**

- `analyze_tide` - For comprehensive tide performance analysis
- `productivity_insights` - For pattern recognition and optimization recommendations
- `optimize_energy` - For energy-based scheduling suggestions
- `team_insights` - For multi-user collaboration analysis
- `custom_tide_analysis` - For flexible user-defined analysis requests

**Data Access:**

- Uses `tide_get_raw_json` for complete tide data
- Integrates with all tide management tools
- Maintains user authentication context for secure data access

### Testing TideProductivityAgent

```bash
# Test the agent locally
curl http://localhost:8787/agents/tide-productivity/stats

curl -X POST http://localhost:8787/agents/tide-productivity/analyze \
  -H "Content-Type: application/json" \
  -d '{"tide_id": "tide_example_123", "analysis_type": "comprehensive"}'

# Run agent-specific tests
npm run test tests/agents/tide-productivity-agent.test.ts
```

## HelloAgent (Reference Implementation)

### Endpoints

#### REST API

- `GET /agents/hello/hello` - Returns a greeting
- `POST /agents/hello/hello` - Returns personalized greeting with `{name}` in body
- `GET /agents/hello/visits` - Increments and returns visit count
- `POST /agents/hello/message` - Store a message with `{message}` in body
- `GET /agents/hello/messages` - Retrieve all stored messages
- `POST /agents/hello/reset` - Reset agent state
- `GET /agents/hello/stats` - Get agent statistics

#### WebSocket

Connect to `/agents/hello/ws` for real-time communication.

Supported message types:

- `ping` - Responds with `pong`
- `echo` - Echoes back the payload
- `broadcast` - Broadcasts message to all connected clients
- `get_stats` - Returns current statistics

### Testing Locally

```bash
# Start the development server
npm run dev

# In another terminal, test REST endpoints
curl http://localhost:8787/agents/hello/hello

curl -X POST http://localhost:8787/agents/hello/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "Tides"}'

curl http://localhost:8787/agents/hello/visits

# Test WebSocket with wscat
npm install -g wscat
wscat -c ws://localhost:8787/agents/hello/ws

# In wscat, send:
> {"type": "ping"}
> {"type": "echo", "payload": "Hello!"}
```

### Running Tests

```bash
# Run all agent tests
npm run test tests/agents/

# Run specific agent test
npm run test tests/agents/hello.test.ts
```

## Creating New Agents

1. Create a new folder under `agents/` with your agent name
2. Create `agent.ts` with your Durable Object implementation
3. Create `index.ts` that exports your agent class
4. Export the class from `src/index.ts`
5. Add the Durable Object binding to `wrangler.toml`
6. Add routing case in `src/index.ts` `handleAgentRequest` function
7. Write comprehensive tests in `tests/agents/`

Example structure for a new `TideAgent`:

```typescript
// agents/tide/agent.ts
export class TideAgent implements DurableObject {
  constructor(state: DurableObjectState, env: Env) {
    // Initialize
  }

  async fetch(request: Request): Promise<Response> {
    // Handle requests
  }
}

// agents/tide/index.ts
export { TideAgent } from "./agent";
```

Update `src/index.ts`:

```typescript
// Export the class
export { TideAgent } from "../agents/tide";

// Add routing case
case 'tide':
  const tideId = env.TIDE_AGENT.idFromName(userId);
  return env.TIDE_AGENT.get(tideId).fetch(agentRequest);
```

Update `wrangler.toml`:

```toml
[[durable_objects.bindings]]
name = "TIDE_AGENT"
class_name = "TideAgent"

[[migrations]]
tag = "v2"
new_classes = ["TideAgent"]
```

## Architecture Notes

- Agents are Durable Objects that maintain state across requests
- Each agent instance is isolated and persistent
- Agents can handle both REST and WebSocket connections
- State is automatically persisted to Durable Object storage
- Agents can communicate with the MCP server for tool execution
- Multiple agent instances can run concurrently for different users/sessions

## Future Agents

Planned agents for the Tides system:

- **TideAgent**: Manages flow sessions, energy tracking, and scheduling
- **AnalyticsAgent**: Aggregates and analyzes productivity patterns
- **NotificationAgent**: Handles smart reminders and alerts
- **CollaborationAgent**: Manages shared flow sessions between users
