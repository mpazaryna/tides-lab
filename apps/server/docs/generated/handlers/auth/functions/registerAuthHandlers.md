[**tides v1.6.0**](../../../README.md)

***

[tides](../../../README.md) / [handlers/auth](../README.md) / registerAuthHandlers

# Function: registerAuthHandlers()

> **registerAuthHandlers**(`server`, `storage`): `void`

Defined in: [src/handlers/auth.ts:31](https://github.com/mpazaryna/tides-server/blob/7fa9a3cc68f661e754e3e9f713b17bb633c050b8/src/handlers/auth.ts#L31)

Register authentication-related MCP tools with the server

Implements security best practices with:
- Careful validation of API keys
- Informative error messages for debugging
- Clear success/failure response formatting
- Support for different storage backend capabilities

## Parameters

### server

`McpServer`

The MCP server instance to register tools with

### storage

`TideStorage`

Storage instance for auth operations

## Returns

`void`
