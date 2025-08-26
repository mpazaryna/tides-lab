# Debug Utilities

This directory contains debugging and development utility scripts for the Tides project.

## Available Scripts

### `debug-template-processing.js`
Utility for testing and debugging MCP prompt template processing.
- Tests template interpolation with mock data
- Validates variable substitution
- Helps diagnose template rendering issues

**Usage:**
```bash
node scripts/debug/debug-template-processing.js
```

### `extract-sse-data.js` 
Extracts JSON data from Server-Sent Events (SSE) responses.
- Parses SSE format responses from MCP server
- Extracts and formats JSON data
- Useful for debugging MCP client interactions

**Usage:**
```bash
node scripts/debug/extract-sse-data.js
```

### `debug-server.js`
Server debugging utility for testing MCP endpoints and responses.
- Tests MCP server functionality
- Validates request/response flow
- Helps diagnose server-side issues

**Usage:**
```bash
node scripts/debug/debug-server.js
```

## Purpose

These utilities were created during the v1.6.0 development cycle to debug:
- MCP prompt template interpolation issues
- Authentication context propagation
- Server-Sent Events parsing
- General MCP server functionality

They are preserved here for future debugging and development reference.