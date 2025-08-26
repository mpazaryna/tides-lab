[**tides v1.6.0**](../../README.md)

***

[tides](../../README.md) / [server](../README.md) / createServer

# Function: createServer()

> **createServer**(`env`, `authContext?`): `McpServer`

Defined in: [src/server.ts:118](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/server.ts#L118)

Creates and configures the Tides MCP server with all tools registered

## Parameters

### env

`any`

Cloudflare Workers environment containing bindings and secrets

### authContext?

Optional authentication context for multi-user support

`null` | `AuthContext`

## Returns

`McpServer`

Fully configured MCP server with all tools registered

## Description

Factory function that creates a fully configured MCP server instance
with all tide management tools registered. This is the main entry point for
React Native applications and AI models to interact with the tidal workflow system.

## Example

```ts
// React Native integration - this is handled by the Worker, but shows the concept
const server = createServer(env, { userId: "user123", email: "user@example.com" });

// The server provides these MCP tools for React Native:
// - tide_create: Create new workflows
// - tide_list: Get tides for FlatList display  
// - tide_flow: Start Pomodoro sessions
// - tide_add_energy: Track mood/energy
// - tide_link_task: Connect GitHub/Linear tasks
// - tide_list_task_links: Show task relationships
// - tide_get_report: Analytics dashboard data
// - tides_get_participants: Multi-user support
```

## Since

1.0.0
