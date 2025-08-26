# Tides Authentication Integration Guide

## Project Structure Overview

Your current setup consists of:

- **Mobile App Frontend**: React Native dashboard with connection testing capabilities
- **Authentication Server**: `/supabase-tides-demo-1` - working auth/connection system for workers
- **Tools Server**: `/tides-server` - contains all tides tools but missing auth integration

## Objective

Integrate the complete authentication/connection process from `/supabase-tides-demo-1` into `/tides-server` to enable seamless mobile app connectivity without frontend changes.

## Current Issues Analysis

### Supabase Demo Server (Working)

- ✅ Authentication succeeds
- ❌ MCP response missing result error
- **Status**: `HTTP 200` but invalid MCP response format

### Tides Server (Failing)

- ❌ HTTP 404 errors on all requests
- **Status**: Server not responding to requests at all

## Required Implementation Steps

### 1. Authentication Infrastructure Migration

Use Context7 MCP to examine Supabase authentication patterns:

- Import authentication middleware from `/supabase-tides-demo-1`
- Copy Supabase client configuration and session management
- Transfer user authentication state handling

### 2. Cloudflare Worker Configuration

Use Context7 MCP to implement proper worker setup:

- Configure worker secrets for Supabase integration:
  ```bash
  npx wrangler secret put SUPABASE_URL
  npx wrangler secret put SUPABASE_ANON_KEY
  ```
- Set up proper routing to handle authentication endpoints
- Implement CORS headers for React Native client communication

### 3. MCP Protocol Implementation

**Critical**: Fix MCP response format issues observed in demo server:

- Ensure all MCP responses include proper `result` field
- Implement error handling for missing/malformed MCP responses
- Add MCP request validation middleware

### 4. Server Integration Architecture

Transfer these components from demo to tides server:

- HTTP client configuration with retry logic
- Authentication context management
- Session persistence and token refresh
- API key validation middleware

### 5. Service Binding Configuration

Use Context7 MCP to set up proper worker bindings:

- Configure service workers for authentication
- Set up proper environment variable handling
- Implement request routing between auth and tools services

## Development Workflow

### Setup Phase

1. Use Context7 MCP to examine Supabase auth patterns in working demo
2. Copy authentication infrastructure to `/tides-server`
3. Configure Cloudflare Worker secrets and environment

### Integration Phase

1. Implement authentication middleware in tides server
2. Add MCP protocol compliance layer
3. Configure proper HTTP response handling
4. Test authentication flow without frontend changes

### Validation Phase

1. Start development server: `npx wrangler dev`
2. Test mobile app connection to tides server
3. Verify MCP responses include proper `result` fields
4. Confirm no 404 errors on authenticated requests

## Key Files to Examine Using Context7 MCP

From `/supabase-tides-demo-1`:

- Authentication service implementation
- Supabase client configuration
- Worker routing configuration
- MCP response formatting logic

## Technical Requirements

- Maintain 100% compatibility with existing mobile app services/context
- Preserve authentication flow and session management
- Fix MCP response format issues
- Enable seamless connection to tides tools

## Error Resolution Targets

1. **404 Errors**: Implement proper routing in `/tides-server`
2. **MCP Response Missing Result**: Add proper MCP response formatting
3. **Authentication Integration**: Transfer complete auth flow from demo server
4. **Session Management**: Maintain user state across requests

## Success Criteria

- Mobile app connects to `/tides-server` without authentication errors
- MCP requests return properly formatted responses with `result` field
- All tides tools accessible through authenticated mobile app connection
- No frontend changes required in mobile application

## Development Notes

- Use Context7 MCP extensively to understand Supabase and Cloudflare Workers patterns
- Examine working authentication code before implementing
- Test each integration step thoroughly before proceeding
- Maintain separation between authentication and tools functionality

This integration should result in a fully functional `/tides-server` that handles both authentication and tools access, replacing the need for the separate demo server.

here is the current console logs when i connect using my /supabase-tides-demo-1 connection:

```
Running "TidesMobile" with {"rootTag":1,"initialProps":null,"fabric":true}
MCPContext.tsx:310 MCP_CONTEXT_031: User not authenticated, resetting state
AuthContext.tsx:53 AUTH_CONTEXT_003: Initializing auth context
authService.ts:36 AUTH_024: Loaded saved worker URL: https://supabase-tides-demo-1.mason-c32.workers.dev
AuthContext.tsx:36 AUTH_CONTEXT_001: Updating auth state {hasUser: true, hasSession: true}
authService.ts:212 AUTH_022: Auth state changed: INITIAL_SESSION
AuthContext.tsx:70 AUTH_CONTEXT_005: Auth state changed: INITIAL_SESSION
AuthContext.tsx:36 AUTH_CONTEXT_001: Updating auth state {hasUser: true, hasSession: true}
AuthContext.tsx:41 AUTH_CONTEXT_002: Retrieved API key {hasApiKey: true}
AuthContext.tsx:41 AUTH_CONTEXT_002: Retrieved API key {hasApiKey: true}
MCPContext.tsx:280 MCP_CONTEXT_030: User authenticated, checking connection
MCPContext.tsx:280 MCP_CONTEXT_030: User authenticated, checking connection
mcpService.ts:186 MCP_013: Pinging MCP server
mcpService.ts:131 MCP_006: Listing tides
mcpService.ts:95 MCP_001: Making MCP request: tide_list undefined
mcpService.ts:186 MCP_013: Pinging MCP server
mcpService.ts:131 MCP_006: Listing tides
mcpService.ts:95 MCP_001: Making MCP request: tide_list undefined
httpClient.ts:49 HTTP_001: Making request to: https://supabase-tides-demo-1.mason-c32.workers.dev
httpClient.ts:64 HTTP_002: Attempt 1/3 for https://supabase-tides-demo-1.mason-c32.workers.dev
httpClient.ts:49 HTTP_001: Making request to: https://supabase-tides-demo-1.mason-c32.workers.dev
httpClient.ts:64 HTTP_002: Attempt 1/3 for https://supabase-tides-demo-1.mason-c32.workers.dev
httpClient.ts:107 HTTP_004: Request successful on attempt 1
mcpService.ts:116 MCP_004: MCP request failed: tide_list Error: MCP response missing result
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:134940:30)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:116
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
mcpService.ts:195 MCP_014: MCP server ping failed: Error: MCP response missing result
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:134940:30)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:195
asyncGeneratorStep @ asyncToGenerator.js:3
_throw @ asyncToGenerator.js:20
Show 8 more frames
Show less
MCPContext.tsx:299 MCP_CONTEXT_002: Connection status: {isConnected: false, hasApiKey: true, workerUrl: 'https://supabase-tides-demo-1.mason-c32.workers.dev'}
httpClient.ts:107 HTTP_004: Request successful on attempt 1
mcpService.ts:116 MCP_004: MCP request failed: tide_list Error: MCP response missing result
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:134940:30)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:116
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
mcpService.ts:195 MCP_014: MCP server ping failed: Error: MCP response missing result
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:134940:30)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:195
asyncGeneratorStep @ asyncToGenerator.js:3
_throw @ asyncToGenerator.js:20
Show 8 more frames
Show less
MCPContext.tsx:299 MCP_CONTEXT_002: Connection status: {isConnected: false, hasApiKey: true, workerUrl: 'https://supabase-tides-demo-1.mason-c32.workers.dev'}
```

here is the current console logs when i connect using my /tides-server connection:

```
Running "TidesMobile" with {"rootTag":1,"initialProps":null,"fabric":true}
MCPContext.tsx:310 MCP_CONTEXT_031: User not authenticated, resetting state
AuthContext.tsx:53 AUTH_CONTEXT_003: Initializing auth context
authService.ts:36 AUTH_024: Loaded saved worker URL: https://supabase-tides-demo-1.mason-c32.workers.dev
AuthContext.tsx:36 AUTH_CONTEXT_001: Updating auth state {hasUser: true, hasSession: true}
authService.ts:212 AUTH_022: Auth state changed: INITIAL_SESSION
AuthContext.tsx:70 AUTH_CONTEXT_005: Auth state changed: INITIAL_SESSION
AuthContext.tsx:36 AUTH_CONTEXT_001: Updating auth state {hasUser: true, hasSession: true}
AuthContext.tsx:41 AUTH_CONTEXT_002: Retrieved API key {hasApiKey: true}
AuthContext.tsx:41 AUTH_CONTEXT_002: Retrieved API key {hasApiKey: true}
MCPContext.tsx:280 MCP_CONTEXT_030: User authenticated, checking connection
MCPContext.tsx:280 MCP_CONTEXT_030: User authenticated, checking connection
mcpService.ts:186 MCP_013: Pinging MCP server
mcpService.ts:131 MCP_006: Listing tides
mcpService.ts:95 MCP_001: Making MCP request: tide_list undefined
mcpService.ts:186 MCP_013: Pinging MCP server
mcpService.ts:131 MCP_006: Listing tides
mcpService.ts:95 MCP_001: Making MCP request: tide_list undefined
httpClient.ts:49 HTTP_001: Making request to: https://tides.mpazbot.workers.dev
httpClient.ts:64 HTTP_002: Attempt 1/3 for https://tides.mpazbot.workers.dev
httpClient.ts:49 HTTP_001: Making request to: https://tides.mpazbot.workers.dev
httpClient.ts:64 HTTP_002: Attempt 1/3 for https://tides.mpazbot.workers.dev
httpClient.ts:96 HTTP_003: Request failed with status 404: 404 Not Found
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:96
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:115 HTTP_005: Attempt 1 failed: Error: HTTP 404:
    at ?anon_0__loop (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135216:40)
    at next (native)
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135259:20)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:115
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:130 HTTP_006: Retrying in 1000ms...
httpClient.ts:96 HTTP_003: Request failed with status 404: 404 Not Found
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:96
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:115 HTTP_005: Attempt 1 failed: Error: HTTP 404:
    at ?anon_0__loop (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135216:40)
    at next (native)
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135259:20)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:115
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:130 HTTP_006: Retrying in 1000ms...
2httpClient.ts:64 HTTP_002: Attempt 2/3 for https://tides.mpazbot.workers.dev
httpClient.ts:96 HTTP_003: Request failed with status 404: 404 Not Found
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:96
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:115 HTTP_005: Attempt 2 failed: Error: HTTP 404:
    at ?anon_0__loop (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135216:40)
    at next (native)
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135259:20)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:115
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:130 HTTP_006: Retrying in 2000ms...
httpClient.ts:96 HTTP_003: Request failed with status 404: 404 Not Found
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:96
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:115 HTTP_005: Attempt 2 failed: Error: HTTP 404:
    at ?anon_0__loop (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135216:40)
    at next (native)
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135259:20)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:115
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:130 HTTP_006: Retrying in 2000ms...
2httpClient.ts:64 HTTP_002: Attempt 3/3 for https://tides.mpazbot.workers.dev
httpClient.ts:96 HTTP_003: Request failed with status 404: 404 Not Found
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:96
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:115 HTTP_005: Attempt 3 failed: Error: HTTP 404:
    at ?anon_0__loop (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135216:40)
    at next (native)
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135259:20)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:115
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
mcpService.ts:116 MCP_004: MCP request failed: tide_list {status: 404, response: '404 Not Found', name: 'Error', message: 'HTTP 404: '}
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:116
asyncGeneratorStep @ asyncToGenerator.js:3
_throw @ asyncToGenerator.js:20
Show 8 more frames
Show less
mcpService.ts:195 MCP_014: MCP server ping failed: {status: 404, response: '404 Not Found', name: 'Error', message: 'HTTP 404: '}
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:195
asyncGeneratorStep @ asyncToGenerator.js:3
_throw @ asyncToGenerator.js:20
Show 8 more frames
Show less
MCPContext.tsx:299 MCP_CONTEXT_002: Connection status: {isConnected: false, hasApiKey: true, workerUrl: 'https://tides.mpazbot.workers.dev'}
httpClient.ts:96 HTTP_003: Request failed with status 404: 404 Not Found
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:96
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
httpClient.ts:115 HTTP_005: Attempt 3 failed: Error: HTTP 404:
    at ?anon_0__loop (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135216:40)
    at next (native)
    at ?anon_0_ (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:135259:20)
    at next (native)
    at asyncGeneratorStep (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22527:19)
    at _next (http://localhost:8081/index.bundle//&platform=ios&dev=true&lazy=true&minify=false&inlineSourceMap=false&modulesOnly=false&runModule=true&excludeSource=true&sourcePaths=url-server&app=com.tidesmobile:22541:29)
    at tryCallOne (address at InternalBytecode.js:1:1180)
    at anonymous (address at InternalBytecode.js:1:1874)
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0__loop @ httpClient.ts:115
?anon_0_ @ httpClient.ts:62
asyncGeneratorStep @ asyncToGenerator.js:3
_next @ asyncToGenerator.js:17
Show 8 more frames
Show less
mcpService.ts:116 MCP_004: MCP request failed: tide_list {status: 404, response: '404 Not Found', name: 'Error', message: 'HTTP 404: '}
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:116
asyncGeneratorStep @ asyncToGenerator.js:3
_throw @ asyncToGenerator.js:20
Show 8 more frames
Show less
mcpService.ts:195 MCP_014: MCP server ping failed: {status: 404, response: '404 Not Found', name: 'Error', message: 'HTTP 404: '}
anonymous @ console.js:654
overrideMethod @ backend.js:17416
reactConsoleErrorHandler @ ExceptionsManager.js:182
anonymous @ setUpDeveloperTools.js:40
registerError @ LogBox.js:231
anonymous @ LogBox.js:80
?anon_0_ @ mcpService.ts:195
asyncGeneratorStep @ asyncToGenerator.js:3
_throw @ asyncToGenerator.js:20
Show 8 more frames
Show less
MCPContext.tsx:299 MCP_CONTEXT_002: Connection status: {isConnected: false, hasApiKey: true, workerUrl: 'https://tides.mpazbot.workers.dev'}
```
