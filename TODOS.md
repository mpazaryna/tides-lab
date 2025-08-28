# TODOs

## P0 - Critical

- [MOBILE] Agent needs to be better at proactively calling tides tools

- [MOBILE] When a tides tool is summoned, it appears in the input (colorful and bold) with IDE-style intellisense parameters
  - [MOBILE] Essential parameters trigger user prompts if missing; non-essential parameters are optional
  - [MOBILE] Tool suggestions replace relevant text when user starts typing

- [MOBILE] make sure ALL tides tools and AI agent commands are available from the tides tool bar

- [MOBILE] Tide info click opens calendar for context switching (daily/weekly/monthly view, or project list for projects)
- [MOBILE] Calendar days show conversation markers for active days
- [MOBILE] Projects are locked for beta (paying customers only)

- [BACKEND] Hardcoded fallbacks need uniformity - 003 should be production fallback. See issue below:  
```
    Mobile ↔ Server Authentication Divergence
  // Mobile hardcoded fallback:
  private currentUrl = "https://tides-006.mpazbot.workers.dev"  // env.006

  // Mobile MCP fallback:
  return this.baseUrl || 'https://tides-001.mpazbot.workers.dev'; // env.001

  // But wrangler.jsonc shows environment inconsistencies:
  "001": { "ENVIRONMENT": "development" }    // 🚨 Should be production
  "003": { "ENVIRONMENT": "production" }     // 🚨 Should be development

  Why This Breaks Everything:
  - Mobile clients authenticate against one environment but make MCP calls to
  another
  - Environment variable mismatches will cause auth context failures
  - Production traffic could hit development databases
  ```

- [BACKEND] Make Agent use the user APIkey to continue to be used. issue detailed below:

```
Durable Object Instantiation Mismatch
  // Server expects user-scoped agents:
  const productivityId =
  env.TIDE_PRODUCTIVITY_AGENT.idFromName(`user-${userId}`);

  // But agent assumes system-wide context:
  userId: 'system', // Default, overridden per request

  The Problem:
  - Server creates per-user agent instances but agents initialize with system 
  context
  - No authentication context passing to agents during instantiation
  - Agent services (MCPClient, TideFetcher) will fail without proper user context
  ```

- [BACKEND] Environment mismatch: 001=dev, 002=staging, 003=production. Remove deprecated mason-c32. 006 is special dev case for this branch. Fix apps/server/wrangler.jsonc:

```
  URL Routing Inconsistencies:
  # Documentation claims:
  env.001 → tides-001.mpazbot.workers.dev (dev)     # 🚨 Wrong
  env.002 → tides-002.mpazbot.workers.dev (staging) # 🚨 Wrong  
  env.003 → tides-003.mpazbot.workers.dev (prod)    # 🚨 Wrong

  # But mobile uses:
  "https://tides-006.mpazbot.workers.dev"           # env.006
  "https://supabase-tides-demo-1.mason-c32.workers.dev" # Legacy

  # And server tests reference:
  "https://tides-003.mpazbot.workers.dev"           # Different domain pattern

  Production Impact: Mobile clients will fail to connect to correct environments,
   causing authentication failures and data isolation breaches.
  ```

- [BACKEND] Critical: Add error boundaries and proper error handling. Details below: 
```
  Service Initialization Failures:
  // Agent services depend on external connectivity:
  this.mcpClient = new MCPClient(userContext);      // No error handling if MCP 
  server unavailable
  this.aiAnalyzer = new AIAnalyzer(this.env.AI);    // Will fail if AI binding 
  unavailable

  No Error Boundaries: Agent failures will cascade to server failures. Missing
  graceful degradation when:
  - AI binding is unavailable (common in development)
  - MCP server connectivity fails
  - User context is invalid/expired
  ```

- [BACKEND] Security issue: API key exposed in debug logs. Fix details below:
```
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

- [BACKEND] Seems to be creating multiple daily tides when a user signs in multiple times, evidence in _006 d1 table_

- [BACKEND] Big security issue with exposing an eamil address, dont really understand, here is the problem from CLaude:
```
  Authentication Security Gap 
  (src/auth/index.ts:48)

  console.warn("[AUTH-FALLBACK] Using fallback auth 
  validation without database lookup - real email not
   available");
  email: `${userId}@mobile.tides.app`, // Fallback - 
  real email should come from database
  Issue: Production auth bypasses database validation
   - security vulnerability.
   ```

- [BACKEND] Big security issue with exposing an eamil address, dont really understand, here is the problem from CLaude:
```
Database Transaction Safety 
  (src/storage/d1-r2.ts:76-136)

  // Current: "Transaction-like pattern" but NOT 
  atomic
  await d1Statement.run();        // D1 insert
  await this.r2.putObject();      // R2 insert - can 
  fail independently
  await analyticsStatement.run(); // Analytics insert
   - can fail independently
  Issue: Data can be left in inconsistent state if R2
   or analytics fail.
```




## P1 - High Priority

- [MOBILE] All flows are hierarchical (daily → upward). Clarify startHierarchicalFlow purpose 

- [MOBILE] Save all tides/agent conversations for persistence across days
- [MOBILE] Daily view: Show saved reports or "create report"/"view conversation" buttons. Chat window matches selected date
- [BACKEND] Test Coverage fell apart for the new files, details below:
```
  - tide-context.ts: 3.17% coverage (should be 90%+)
  - tide-hierarchical-flow.ts: 2.27% coverage (should
   be 90%+)
  - 22 failing tests in the suite

  Impact: Core hierarchical features are untested in
  production scenarios.
```
- [BACKEND]  AI Service Resource Management 
  (src/services/aiService.ts)

  // 847 lines of AI logic in single file
  await
  this.env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
    messages: [...],
    max_tokens: 400,  // No rate limiting or quotas
  });
  Issues:
  - No rate limiting on Workers AI calls
  - Memory cache without TTL management
  - Single monolithic service file


## P2 - Performance Polish

- [MOBILE] **Fix AgentService re-configs** - Add `useMemo` dependency array in `ChatContext.tsx:XX`
- [MOBILE] **Memoize URL provider** - Add `useCallback` in `MCPContext.tsx:XX`

- [MOBILE] Add tool action buttons below agent responses - pre-fill parameters in input when clicked

## P3 - Nice to Haves

- [MOBILE] **Better network detection** - Add NetInfo listener for online/offline states
- [MOBILE] **Enhanced retry logging** - Add attempt counts and delays to MCP retry logs
- [MOBILE] **Loading states** - Show spinners during health checks
- [MOBILE] **Friendly error messages** - Replace technical errors with user-friendly text



## Quick Fixes

### 1. Fix Environment Variable Chaos
  // apps/server/wrangler.jsonc - Fix these WRONG mappings:
  "001": {
    "vars": {
      "ENVIRONMENT": "production"  // ✅ Change from "development"
    }
  },
  "003": {
    "vars": {
      "ENVIRONMENT": "development"  // ✅ Change from "production"
    }
  }

  2. Remove Security Violations
  // apps/mobile/src/services/authService.ts:148-154
  // DELETE these lines entirely:
  console.log('[DEBUG] Full API key details:', {
    fullToken: apiKey,  // 🚨 NEVER LOG FULL TOKENS
    // ... delete the whole block
  });

### Quick Integration Fixes (1 hour)

  3. Standardize Mobile Fallback URLs
  // apps/mobile/src/services/authService.ts:8
  private currentUrl = "https://tides-001.mpazbot.workers.dev"; // ✅ Match 
  server env.001

  // apps/mobile/src/services/mcpService.ts:111  
  return this.baseUrl || 'https://tides-001.mpazbot.workers.dev'; // ✅ Same URL

  4. Add Basic Agent Error Boundaries
  // apps/agents/tide-productivity-agent/agent.ts:51-75
  private async initialize(): Promise<void> {
    try {
      // ... existing code ...
    } catch (error) {
      console.error('[TideProductivityAgent] Initialization failed:', error);
      // ✅ ADD: Set agent to degraded mode instead of throwing
      this.isDegraded = true;
      return; // Don't throw - let agent run in limited mode
    }
  }

### Documentation Fixes (15 minutes)

  5. Update CLAUDE.md URLs
  // CLAUDE.md:95-97 - Fix the environment descriptions:
  - env.001 → `tides-001.mpazbot.workers.dev` (prod)     // ✅ prod not dev
  - env.002 → `tides-002.mpazbot.workers.dev` (staging)  // ✅ correct
  - env.003 → `tides-003.mpazbot.workers.dev` (dev)      // ✅ dev not prod

### Code Quality Wins (30 minutes)

  6. Remove TODOs That Block Production
  // apps/mobile/src/services/mcpService.ts:59-67
  // DELETE these TODO comments - they're just noise:
  // TODO: Remove debug logging before production release
  // TODO: Replace debug logging with proper error analytics  
  // TODO: Implement proper health check fallback strategy

  7. Reduce Observability Noise
  // apps/server/wrangler.jsonc:11
  "observability": {
    "enabled": true,
    "head_sampling_rate": 0.1,  // ✅ Change from 1 (100%) to 0.1 (10%)
  }

### Easy Type Safety Win (45 minutes)

  8. Create Shared Types File
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

  // Then import in both mobile/src/services/mcpService.ts and 
  server/src/handlers/tools.ts

### Backend Engineer's Debugging Kit

  9. Add Request Tracing
  // apps/server/src/index.ts:331 - Add request ID for debugging:
  export default {
    fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
      const requestId = crypto.randomUUID(); // ✅ ADD
      console.log(`[${requestId}] ${request.method} ${url.pathname}`); // ✅ ADD

      // Pass requestId through to all handlers for correlation
    }
  }

  10. Create Health Check Endpoint
  // apps/server/src/index.ts:340 - Add before CORS check:
  if (url.pathname === "/health" && request.method === "GET") {
    return new Response(JSON.stringify({
      status: "healthy",
      environment: env.ENVIRONMENT,
      timestamp: new Date().toISOString(),
      version: "1.6.0"
    }), {
      headers: { "Content-Type": "application/json", ...CORS_HEADERS }
    });
  }


  Fix 1: Implement Atomic Transactions

  // In src/storage/d1-r2.ts - replace current 
  createTide method
  async createTide(input: CreateTideInput):
  Promise<Tide> {
    const batch = this.db.batch([
      d1Statement,
      analyticsStatement
    ]);

    try {
      await batch; // Atomic D1 operations
      await this.r2.putObject(); // Only after D1 
  success
    } catch (error) {
      // Proper rollback logic
    }
  }

  Fix 2: Replace Auth Fallback with Database 
  Validation

  // In src/auth/index.ts - remove fallback, require 
  database lookup
  export async function validateApiKey(apiKey: 
  string, storage: TideStorage) {
    const authResult = await
  storage.validateApiKey(apiKey);
    if (!authResult) return null;
    return authResult; // Real email from database
  }

  Fix 3: Add Rate Limiting to AI Service

  // In src/services/aiService.ts
  private rateLimiter = new Map(); // userId -> { 
  count, resetTime }

  async analyzeProductivity(request: 
  ProductivityAnalysisRequest) {
    if (!this.checkRateLimit(request.userId)) {
      throw new Error("Rate limit exceeded");
    }
    // ... existing logic
  }

  Fix 4: Remove Debug Logging

  // Replace all console.log with conditional logging
  if (this.env.ENVIRONMENT === 'development') {
    console.log(...);
  }

  Fix 5: Add Missing Tests

  Need comprehensive test coverage for:
  - tide-context.ts - Context switching scenarios
  - tide-hierarchical-flow.ts - Auto-creation logic
  - AI service error handling
  - Database transaction rollbacks