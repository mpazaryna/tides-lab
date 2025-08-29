# TODOs

## P0 - Critical

- **[MOBILE]** Agent needs to be better at proactively calling tides tools

- **[MOBILE]** When a tides tool is summoned, it appears in the input (colorful and bold) with IDE-style intellisense parameters
  - **[MOBILE]** Essential parameters trigger user prompts if missing; non-essential parameters are optional
  - **[MOBILE]** Tool suggestions replace relevant text when user starts typing

- **[MOBILE]** Make sure ALL tides tools and AI agent commands are available from the tides tool bar

- **[MOBILE]** Tide info click opens calendar for context switching (daily/weekly/monthly view, or project list for projects)
- **[MOBILE]** Calendar days show conversation markers for active days
- **[MOBILE]** Projects are locked for beta (paying customers only)

- **[BACKEND]** Hardcoded fallbacks need uniformity - 003 should be production fallback. See issue below:

```javascript
Mobile ↔ Server Authentication Divergence
// Mobile hardcoded fallback:
private currentUrl = "https://tides-006.mpazbot.workers.dev"  // env.006

// Mobile MCP fallback:
return this.baseUrl || 'https://tides-001.mpazbot.workers.dev'; // env.001

// But wrangler.jsonc shows environment inconsistencies:
"001": { "ENVIRONMENT": "development" }    // 🚨 Should be production
"003": { "ENVIRONMENT": "production" }     // 🚨 Should be development

Why This Breaks Everything:
- Mobile clients authenticate against one environment but make MCP calls to another
- Environment variable mismatches will cause auth context failures
- Production traffic could hit development databases
```

- **[BACKEND]** Make Agent use the user API key to continue to be used. Issue detailed below:

```javascript
Durable Object Instantiation Mismatch
// Server expects user-scoped agents:
const productivityId = env.TIDE_PRODUCTIVITY_AGENT.idFromName(`user-${userId}`);

// But agent assumes system-wide context:
userId: 'system', // Default, overridden per request

The Problem:
- Server creates per-user agent instances but agents initialize with system context
- No authentication context passing to agents during instantiation
- Agent services (MCPClient, TideFetcher) will fail without proper user context
```

- **[BACKEND]** Critical: Add error boundaries and proper error handling. Details below:

```javascript
Service Initialization Failures:
// Agent services depend on external connectivity:
this.mcpClient = new MCPClient(userContext);      // No error handling if MCP server unavailable
this.aiAnalyzer = new AIAnalyzer(this.env.AI);    // Will fail if AI binding unavailable

No Error Boundaries: Agent failures will cascade to server failures. Missing
graceful degradation when:
- AI binding is unavailable (common in development)
- MCP server connectivity fails
- User context is invalid/expired
```

- **[BACKEND]** Security issue: API key exposed in debug logs. Fix details below:

```javascript
API Key Exposure:
// Debug logging in production code:
console.log('[DEBUG] Full API key details:', {
  fullToken: apiKey,  // 🚨 SECURITY VIOLATION
});

Cross-Environment Data Leakage:
- Environment 002 has both primary DB and SUPABASE_DB bindings
- Test keys work across environments
- No proper API key scoping or environment isolation
```

- **[BACKEND]** Creating multiple daily tides when a user signs in multiple times (evidence in env.006 D1 table)

- **[BACKEND]** Authentication security gap - fallback auth bypasses database validation:

```javascript
Authentication Security Gap (src/auth/index.ts:48)

console.warn("[AUTH-FALLBACK] Using fallback auth validation without database lookup - real email not available");
email: `${userId}@mobile.tides.app`, // Fallback - real email should come from database

Issue: Production auth bypasses database validation - security vulnerability.
```

- **[BACKEND]** Database transaction safety - operations are not atomic:

```javascript
Database Transaction Safety (src/storage/d1-r2.ts:76-136)

// Current: "Transaction-like pattern" but NOT atomic
await d1Statement.run();        // D1 insert
await this.r2.putObject();      // R2 insert - can fail independently
await analyticsStatement.run(); // Analytics insert - can fail independently

Issue: Data can be left in inconsistent state if R2 or analytics fail.
```

- **[BACKEND]** Add request tracing for debugging:

```typescript
// apps/server/src/index.ts:331 - Add request ID for debugging:
export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    const requestId = crypto.randomUUID(); // ✅ ADD
    console.log(`[${requestId}] ${request.method} ${url.pathname}`); // ✅ ADD

    // Pass requestId through to all handlers for correlation
  }
}
```

## P1 - High Priority

- **[MOBILE]** All flows are hierarchical (daily → upward). Clarify startHierarchicalFlow purpose

- **[MOBILE]** Save all tides/agent conversations for persistence across days
- **[MOBILE]** Daily view: Show saved reports or "create report"/"view conversation" buttons. Chat window matches selected date

- **[BACKEND]** Test coverage fell apart for new files, details below:

```javascript
- tide-context.ts: 3.17% coverage (should be 90%+)
- tide-hierarchical-flow.ts: 2.27% coverage (should be 90%+)
- 22 failing tests in the suite

Impact: Core hierarchical features are untested in production scenarios.
```

- **[BACKEND]** AI Service Resource Management (src/services/aiService.ts)

```javascript
// 847 lines of AI logic in single file
await this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
  messages: [...],
  max_tokens: 400,  // No rate limiting or quotas
});

Issues:
- No rate limiting on Workers AI calls
- Memory cache without TTL management
- Single monolithic service file
```

- **[BACKEND]** Create shared types file for MCP contracts:

```typescript
// Create: shared/types/mcp-contracts.ts
export interface MCPTideCreateRequest {
  name: string;
  description?: string;
  flow_type?: string;
}

export interface MCPTideCreateResponse {
  success: boolean;
  tide_id?: string;
  error?: string;
}

// Then import in both mobile/src/services/mcpService.ts and server/src/handlers/tools.ts
```

## P2 - Performance Polish

- **[MOBILE]** Fix AgentService re-configs - Add `useMemo` dependency array in `ChatContext.tsx`
- **[MOBILE]** Memoize URL provider - Add `useCallback` in `MCPContext.tsx`
- **[MOBILE]** Add tool action buttons below agent responses - pre-fill parameters in input when clicked

- **[BACKEND]** Remove TODO comments that block production:

```javascript
// apps/mobile/src/services/mcpService.ts:59-67
// DELETE these TODO comments - they're just noise:
// TODO: Remove debug logging before production release
// TODO: Replace debug logging with proper error analytics  
// TODO: Implement proper health check fallback strategy
```

- **[BACKEND]** Reduce observability noise:

```javascript
// apps/server/wrangler.jsonc:11
"observability": {
  "enabled": true,
  "head_sampling_rate": 0.1,  // ✅ Change from 1 (100%) to 0.1 (10%)
}
```

## P3 - Nice to Haves

- **[MOBILE]** Better network detection - Add NetInfo listener for online/offline states
- **[MOBILE]** Enhanced retry logging - Add attempt counts and delays to MCP retry logs
- **[MOBILE]** Loading states - Show spinners during health checks
- **[MOBILE]** Friendly error messages - Replace technical errors with user-friendly text