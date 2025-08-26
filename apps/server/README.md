# Tides

A Model Context Protocol (MCP) server with autonomous Cloudflare Agents for intelligent workflow management, built with TypeScript and deployed on Cloudflare Workers.

## Elevator Description

**Tides transforms how you work by understanding your natural productivity rhythms.**

Just like ocean tides, your energy and focus ebb and flow throughout the day. Some mornings you're unstoppable; some afternoons you hit a wall. Tides captures these patterns - when you're in deep flow, when you need breaks, when you do your best thinking.

It's not another time tracker or todo list. It's a system that learns your unique work rhythms and helps you surf your high-energy waves while respecting your low tides. Track focused work sessions, monitor your energy levels, and discover patterns you never noticed. Over time, Tides reveals when to schedule important work, when to take breaks, and how to optimize your day around your natural productivity cycles.

Your AI assistant becomes your productivity coach - not just suggesting what to do, but understanding when you're at your best to do it.

## What is Tides?

Tides is a **universal agentic productivity platform** that enables any AI agent or client to intelligently interact with tidal workflow data through the Model Context Protocol (MCP):

- **Universal AI Integration** - Any AI agent can analyze and optimize productivity patterns
- **Complete MCP Interface** - 9 tools + 5 AI analysis prompts for comprehensive workflow management
- **Create workflows** with different flow types (daily, weekly, project, seasonal)
- **Track focus sessions** with intensity and energy levels
- **Link external tasks** from GitHub, Linear, Obsidian
- **Generate reports** in multiple formats (JSON, Markdown, CSV)
- **AI-Powered Analysis** - 5 specialized prompts for intelligent productivity insights
- **Multi-user support** with secure API key authentication for enterprise AI deployments
- **Autonomous Agents** powered by Cloudflare Durable Objects for real-time features
- **WebSocket support** for live synchronization with React Native apps

## Quick Start

**Development:**

```bash
npm run dev                # Start local server with agents
npm run test               # Run all tests including agents
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e           # End-to-end tests only
npm run test tests/agents/ # Test agent functionality
```

**Deployment:**

```bash
npm run deploy # Deploy to Cloudflare Workers with Durable Objects
```

**Live Environments:**

- Production: `https://tides-001.mpazbot.workers.dev/mcp`
- Staging: `https://tides-002.mpazbot.workers.dev/mcp`
- Development: `https://tides-003.mpazbot.workers.dev/mcp`

## MCP Interface Available

### MCP Tools (9 Available)

| Tool                | Purpose                   |
| ------------------- | ------------------------- |
| `tide_create`       | Create new workflows      |
| `tide_list`         | List tides with filtering |
| `tide_flow`         | Start focus sessions      |
| `tide_add_energy`   | Track energy/mood         |
| `tide_link_task`    | Connect external tasks    |
| `tide_get_report`   | Generate analytics        |
| `tide_get_raw_json` | Export complete raw data  |
| `tide_task_links`   | List linked tasks         |
| `get_participants`  | Get user participants     |
| `auth_validate_key` | Validate API keys         |

### MCP AI Analysis Prompts (5 Available)

| Prompt                  | Purpose                                   |
| ----------------------- | ----------------------------------------- |
| `analyze_tide`          | Comprehensive tide performance analysis   |
| `productivity_insights` | Pattern recognition and optimization tips |
| `optimize_energy`       | Energy-based scheduling recommendations   |
| `team_insights`         | Multi-user collaboration analysis         |
| `custom_tide_analysis`  | Flexible user-defined analysis requests   |

## Cloudflare Agents (v1.6.0)

Tides includes autonomous agents powered by Durable Objects for real-time features and AI-powered productivity analysis:

### HelloAgent

A production-ready test agent demonstrating the agent pattern:

**REST Endpoints:**

- `GET /agents/hello/hello` - Returns greeting
- `POST /agents/hello/hello` - Personalized greeting
- `GET /agents/hello/visits` - Visit counter
- `POST /agents/hello/message` - Store messages
- `GET /agents/hello/messages` - Retrieve messages
- `GET /agents/hello/stats` - Agent statistics

**WebSocket Endpoint:**

- `ws://[host]/agents/hello/ws` - Real-time communication
  - Supports: ping/pong, echo, broadcast, stats

### TideProductivityAgent

AI-powered productivity agent that analyzes workflow patterns and provides intelligent insights:

**REST Endpoints:**

- `GET /agents/tide-productivity/analyze` - Get AI productivity analysis
- `POST /agents/tide-productivity/analyze` - Request custom analysis with parameters
- `GET /agents/tide-productivity/insights` - Get cached productivity insights
- `GET /agents/tide-productivity/stats` - Agent statistics and performance metrics

**MCP Integration:**

- Uses all 5 MCP analysis prompts for comprehensive insights
- Provides intelligent scheduling recommendations
- Analyzes energy patterns and optimization opportunities
- Generates productivity reports with actionable recommendations

### Testing Agents

```bash
# Unit tests for agents (including TideProductivityAgent)
npm run test tests/agents/

# Test specific agents
npm run test tests/agents/hello.test.ts
npm run test tests/agents/tide-productivity-agent.test.ts

# E2E tests against deployed agents and MCP prompts
npm run test:e2e

# Monitor agent logs
npm run monitor:live
```

## Configuration

**Claude Desktop:**

```json
{
  "mcpServers": {
    "tides": {
      "command": "npx",
      "args": ["mcp-remote", "https://tides-001.mpazbot.workers.dev/mcp"],
      "env": {
        "AUTHORIZATION": "Bearer tides_testuser_001"
      }
    }
  }
}
```

**Test API Keys:**

- `tides_testuser_001` through `tides_testuser_005`
- Each key maps to isolated user data
- See [Authentication Guide](./docs/guides/auth-overview.md) for details

## Documentation

- **[Architecture Overview](docs/architecture.md)** - System design and components
- **[Contributing Guide](CONTRIBUTING.md)** - Development setup and guidelines
- **[Cloudflare Agents Spec](docs/specs/cloudflare-agents.md)** - Comprehensive agent architecture
- **[Agent Documentation](agents/README.md)** - How to create and test agents
- **[Test Organization](tests/README.md)** - Unit, integration, and E2E test structure
- **[Migration Spec](docs/specs/migration-spec.md)** - Complete migration from Python FastMCP
- **[Setup Guides](docs/)** - API tokens, monitoring, deployment
- **[MCP Documentation](https://modelcontextprotocol.io)** - Model Context Protocol

## Architecture

Tides uses a hybrid architecture combining MCP server capabilities with Cloudflare's edge infrastructure:

- **MCP Server**: Handles tool execution and AI model interactions
- **Durable Objects**: Provide persistent state and real-time features via agents
- **D1 Database**: Stores user data, tides, and flow sessions
- **R2 Storage**: Object storage for large data and attachments
- **Workers AI**: Powers intelligent scheduling and pattern recognition

See [CHANGELOG.md](CHANGELOG.md) for detailed version history.
