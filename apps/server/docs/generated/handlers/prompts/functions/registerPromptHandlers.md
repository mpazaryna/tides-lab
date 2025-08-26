[**tides v1.6.0**](../../../README.md)

***

[tides](../../../README.md) / [handlers/prompts](../README.md) / registerPromptHandlers

# Function: registerPromptHandlers()

> **registerPromptHandlers**(`server`, `storage`, `authContext?`): `void`

Defined in: [src/handlers/prompts.ts:173](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/handlers/prompts.ts#L173)

Register all MCP prompts for tide analysis with the server

Provides templated prompts for:
- Comprehensive tide analysis with productivity patterns
- Productivity insights with time-based comparisons  
- Energy optimization recommendations
- Team collaboration insights
- Custom analysis with flexible question handling

## Parameters

### server

`McpServer`

The MCP server instance to register prompts with

### storage

`TideStorage`

Storage instance for data access

### authContext?

Authentication context for multi-user support

`null` | `AuthContext`

## Returns

`void`
