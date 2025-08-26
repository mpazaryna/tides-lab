[**tides v1.6.0**](../../../README.md)

***

[tides](../../../README.md) / [handlers/tools](../README.md) / registerTideTools

# Function: registerTideTools()

> **registerTideTools**(`server`, `storage`): `void`

Defined in: [src/handlers/tools.ts:35](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/handlers/tools.ts#L35)

Register all core tide management MCP tools with the server

Implements Cloudflare MCP Server registration patterns with:
- Clear tool descriptions for LLM interaction (CRITICAL)
- snake_case naming convention following service_noun_verb pattern
- Granular tools (create, list, flow vs monolithic actions)
- Robust error handling with informative messages
- Zod schema validation for all inputs
- Stateless design for scalability

## Parameters

### server

`McpServer`

The MCP server instance to register tools with

### storage

`TideStorage`

Storage instance for tool operations

## Returns

`void`
